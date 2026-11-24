"""Publica fotos en la página de Facebook y el Instagram de Galmor Textiles (API de Meta).

Solo habla con graph.facebook.com. El token del usuario del sistema no está en este archivo:
el proxy de la sesión lo agrega a cada pedido. El token de la página se pide al vuelo y nunca se muestra.

Uso:
  python3 publicar_meta.py probar
  python3 publicar_meta.py publicar TEXTO.txt FOTO1.jpg [FOTO2.jpg ...] [--solo-facebook | --solo-instagram]
  python3 publicar_meta.py editar-facebook ID_DEL_POST TEXTO.txt
  python3 publicar_meta.py reel TEXTO.txt VIDEO.mp4 [--solo-facebook | --solo-instagram]

Los videos se suben a rupload.facebook.com (Reels de Facebook e Instagram).
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

API = "https://graph.facebook.com/v21.0"


def pedir(metodo, ruta, datos=None, archivo=None, token=None):
    url = f"{API}/{ruta.lstrip('/')}"
    datos = dict(datos or {})
    if token:
        datos["access_token"] = token
    if metodo == "GET":
        if datos:
            url += "?" + urllib.parse.urlencode(datos)
        req = urllib.request.Request(url)
    elif archivo:
        # Reason: subir una foto exige multipart/form-data; se arma a mano para no instalar nada.
        limite = uuid.uuid4().hex
        partes = []
        for k, v in datos.items():
            partes.append(f'--{limite}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        with open(archivo, "rb") as f:
            contenido = f.read()
        partes.append(f'--{limite}\r\nContent-Disposition: form-data; name="source"; filename="foto.jpg"\r\n'
                      f"Content-Type: image/jpeg\r\n\r\n".encode() + contenido + b"\r\n")
        partes.append(f"--{limite}--\r\n".encode())
        req = urllib.request.Request(url, data=b"".join(partes), method="POST",
                                     headers={"Content-Type": f"multipart/form-data; boundary={limite}"})
    else:
        req = urllib.request.Request(url, data=urllib.parse.urlencode(datos).encode(), method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        error = json.load(e).get("error", {})
        sys.exit(f"Error de Meta en {ruta}: {error.get('message')} (código {error.get('code')})")


def pagina_galmor():
    paginas = pedir("GET", "me/accounts", {"fields": "id,name,access_token,instagram_business_account{id,username}"})
    if not paginas.get("data"):
        sys.exit("El token no ve ninguna página. Revisa los activos asignados al usuario del sistema.")
    return paginas["data"][0]


def probar():
    yo = pedir("GET", "me", {"fields": "id,name"})
    p = pagina_galmor()
    ig = p.get("instagram_business_account") or {}
    print(f"Token de: {yo['name']}")
    print(f"Página: {p['name']} (id {p['id']})")
    print(f"Instagram: @{ig.get('username', '— no conectado —')}")


def publicar(texto, fotos, facebook=True, instagram=True):
    p = pagina_galmor()
    token_pagina = p["access_token"]
    # Fotos subidas a la página sin publicar: sirven al post de Facebook y dan la URL pública para Instagram.
    ids = [pedir("POST", f"{p['id']}/photos", {"published": "false"}, archivo=f, token=token_pagina)["id"] for f in fotos]

    if facebook:
        datos = {"message": texto}
        for i, foto in enumerate(ids):
            datos[f"attached_media[{i}]"] = json.dumps({"media_fbid": foto})
        post = pedir("POST", f"{p['id']}/feed", datos, token=token_pagina)
        print(f"Facebook: https://www.facebook.com/{post['id']}")

    if instagram:
        ig = (p.get("instagram_business_account") or {}).get("id")
        if not ig:
            sys.exit("La página no tiene Instagram conectado.")
        urls = [pedir("GET", foto, {"fields": "images"}, token=token_pagina)["images"][0]["source"] for foto in ids]
        if len(urls) == 1:
            contenedor = pedir("POST", f"{ig}/media", {"image_url": urls[0], "caption": texto})["id"]
        else:
            hijos = [pedir("POST", f"{ig}/media", {"image_url": u, "is_carousel_item": "true"})["id"] for u in urls]
            contenedor = pedir("POST", f"{ig}/media",
                               {"media_type": "CAROUSEL", "children": ",".join(hijos), "caption": texto})["id"]
        for _ in range(30):  # Instagram procesa las fotos antes de dejar publicar
            if pedir("GET", contenedor, {"fields": "status_code"}).get("status_code") == "FINISHED":
                break
            time.sleep(4)
        media = pedir("POST", f"{ig}/media_publish", {"creation_id": contenedor})["id"]
        print(f"Instagram: {pedir('GET', media, {'fields': 'permalink'})['permalink']}")


def subir_video(url, archivo, token):
    # Reason: los videos van en bruto a rupload.facebook.com con el token en la cabecera, no en multipart.
    with open(archivo, "rb") as f:
        contenido = f.read()
    req = urllib.request.Request(url, data=contenido, method="POST", headers={
        "Authorization": f"OAuth {token}", "offset": "0", "file_size": str(len(contenido))})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Error de Meta al subir el video: {e.read().decode()[:300]}")


def esperar(objeto, campo, listo, token=None):
    for _ in range(60):  # Meta procesa el video antes de dejar publicarlo
        estado = pedir("GET", objeto, {"fields": campo}, token=token).get(campo)
        if listo(estado):
            return estado
        time.sleep(5)
    sys.exit(f"Meta no terminó de procesar {objeto}: {estado}")


def publicar_reel(texto, video, facebook=True, instagram=True):
    p = pagina_galmor()
    token_pagina = p["access_token"]
    if facebook:
        inicio = pedir("POST", f"{p['id']}/video_reels", {"upload_phase": "start"}, token=token_pagina)
        subir_video(inicio["upload_url"], video, token_pagina)
        pedir("POST", f"{p['id']}/video_reels", {"upload_phase": "finish", "video_id": inicio["video_id"],
                                                  "video_state": "PUBLISHED", "description": texto},
              token=token_pagina)
        print(f"Facebook Reel: https://www.facebook.com/reel/{inicio['video_id']}")
    if instagram:
        ig = (p.get("instagram_business_account") or {}).get("id")
        if not ig:
            sys.exit("La página no tiene Instagram conectado.")
        cont = pedir("POST", f"{ig}/media", {"media_type": "REELS", "upload_type": "resumable",
                                              "caption": texto, "share_to_feed": "true"}, token=token_pagina)
        subir_video(cont["uri"], video, token_pagina)
        esperar(cont["id"], "status_code", lambda s: s == "FINISHED" or s == "ERROR", token=token_pagina)
        media = pedir("POST", f"{ig}/media_publish", {"creation_id": cont["id"]}, token=token_pagina)["id"]
        print(f"Instagram Reel: {pedir('GET', media, {'fields': 'permalink'}, token=token_pagina)['permalink']}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["probar"]:
        probar()
    elif args[:1] == ["comentar-facebook"] and len(args) == 3:
        with open(args[2], encoding="utf-8") as f:
            c = pedir("POST", f"{args[1]}/comments", {"message": f.read().strip()},
                      token=pagina_galmor()["access_token"])
        print(f"Comentario publicado: {c['id']}")
    elif args[:1] == ["reel"] and len(args) >= 3:
        opciones = {a for a in args if a.startswith("--")}
        with open(args[1], encoding="utf-8") as f:
            pie = f.read().strip()
        publicar_reel(pie, args[2], facebook="--solo-instagram" not in opciones,
                      instagram="--solo-facebook" not in opciones)
    elif args[:1] == ["editar-facebook"] and len(args) == 3:
        # Instagram no deja cambiar el texto por API; Facebook sí.
        with open(args[2], encoding="utf-8") as f:
            pedir("POST", args[1], {"message": f.read().strip()}, token=pagina_galmor()["access_token"])
        print(f"Facebook editado: https://www.facebook.com/{args[1]}")
    elif args[:1] == ["publicar"] and len(args) >= 3:
        opciones = {a for a in args if a.startswith("--")}
        archivos = [a for a in args[1:] if not a.startswith("--")]
        with open(archivos[0], encoding="utf-8") as f:
            pie = f.read().strip()
        publicar(pie, archivos[1:], facebook="--solo-instagram" not in opciones,
                 instagram="--solo-facebook" not in opciones)
    else:
        sys.exit(__doc__)

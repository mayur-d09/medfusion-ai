import qrcode

def generate_qr(pid):
    img = qrcode.make(pid)
    img.save(f"{pid}.png")

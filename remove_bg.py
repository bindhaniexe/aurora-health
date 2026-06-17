from PIL import Image

def make_white_transparent(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    newData = []
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

make_white_transparent(r"assets\images\login_illustration.png", r"assets\images\login_illustration.png")
make_white_transparent(r"assets\images\signup_illustration.png", r"assets\images\signup_illustration.png")

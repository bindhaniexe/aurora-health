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

make_white_transparent(r"C:\Users\subha\.gemini\antigravity-ide\brain\734ad561-0d11-4947-93ca-78efe99260fd\aurora_mascot_1781479277123.png", r"assets\images\aurora_mascot.png")

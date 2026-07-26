import fitz  # PyMuPDF
import os

# 打开你的 PDF 文件
doc = fitz.open("public/pdfs/echo-issue-01.pdf")
output_dir = "public/magazine-pages"
os.makedirs(output_dir, exist_ok=True)

# 遍历每一页并保存为 JPG
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)  # dpi=150 保证清晰度且体积适中
    image_path = os.path.join(output_dir, f"page-{i+1}.jpg")
    pix.save(image_path)
    print(f"已生成: {image_path}")

print("🎉 全部页面转换完毕！")
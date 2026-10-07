from PIL import Image, ImageDraw
import math

size = 1024
image = Image.new("RGB", (size, size), "#07111F")
draw = ImageDraw.Draw(image)
center = size // 2
for radius, color, width in [(350, "#13263D", 10), (270, "#27415C", 6)]:
    draw.ellipse((center-radius, center-radius, center+radius, center+radius), outline=color, width=width)

def hex_points(cx, cy, r, rotation):
    return [(cx + r * math.cos(rotation + i * math.pi / 3), cy + r * math.sin(rotation + i * math.pi / 3)) for i in range(6)]

for layer, (dx, dy, color) in enumerate([(-38, -24, "#9B8CFF"), (38, 24, "#65E6E0")]):
    points = [hex_points(center + dx, center + dy, 240, math.pi / 6 + (0.08 if layer else 0))]
    for ring in range(3):
        r = 88 + ring * 76
        for i in range(6):
            x = center + dx + r * math.cos(math.pi / 6 + i * math.pi / 3)
            y = center + dy + r * math.sin(math.pi / 6 + i * math.pi / 3)
            draw.ellipse((x-18, y-18, x+18, y+18), fill=color)
    vertices = points[0]
    draw.line(vertices + [vertices[0]], fill=color, width=9, joint="curve")
    for i in range(6):
        x, y = vertices[i]
        draw.ellipse((x-22, y-22, x+22, y+22), fill=color)

image.save("assets/images/icon.png")
image.save("assets/images/splash-icon.png")
image.save("assets/images/favicon.png")
image.save("assets/images/android-icon-foreground.png")

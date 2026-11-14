"""
Color Theme and Palette Definitions
Allows easy re-theming or skinning of the arcade presentation.
"""

Color = tuple[int, int, int]
ColorAlpha = tuple[int, int, int, int]

# Background and Grid
COLOR_BG: Color = (18, 22, 34)
COLOR_GRID: Color = (28, 34, 52)
COLOR_HUD_BG: Color = (12, 15, 24)

# Snake Palette
COLOR_SNAKE_HEAD: Color = (64, 224, 130)
COLOR_SNAKE_BODY: Color = (40, 180, 99)
COLOR_SNAKE_EYE: Color = (255, 255, 255)
COLOR_SNAKE_PUPIL: Color = (18, 22, 34)

# Food Palettes
COLOR_FOOD: Color = (255, 75, 75)
COLOR_FOOD_GLOW: Color = (255, 120, 120)

COLOR_GOLDEN: Color = (255, 215, 0)
COLOR_GOLDEN_GLOW: Color = (255, 235, 120)

# UI & Typography
COLOR_TEXT_PRIMARY: Color = (240, 244, 255)
COLOR_TEXT_DIM: Color = (140, 150, 180)
COLOR_TEXT_ACCENT: Color = (255, 215, 0)
COLOR_GAME_OVER: Color = (255, 80, 80)

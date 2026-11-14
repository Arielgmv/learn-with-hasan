#!/usr/bin/env python3
"""
Snake Game (Terminal Edition)
Built with Python's standard library `curses` module.
Zero external dependencies required.
"""

import curses
import json
import os
import random
import time

HIGH_SCORE_FILE = os.path.join(os.path.dirname(__file__), "highscore.json")
MIN_LINES = 22
MIN_COLS = 50

# Game area size inside the window
BOARD_HEIGHT = 18
BOARD_WIDTH = 44


def load_high_score() -> int:
    try:
        if os.path.exists(HIGH_SCORE_FILE):
            with open(HIGH_SCORE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return int(data.get("high_score", 0))
    except Exception:
        pass
    return 0


def save_high_score(score: int) -> None:
    try:
        current = load_high_score()
        if score > current:
            with open(HIGH_SCORE_FILE, "w", encoding="utf-8") as f:
                json.dump({"high_score": score}, f)
    except Exception:
        pass


def get_random_food_pos(snake: list, golden: tuple | None = None) -> tuple[int, int]:
    occupied = set(snake)
    if golden:
        occupied.add(golden)

    while True:
        y = random.randint(1, BOARD_HEIGHT - 2)
        x = random.randint(1, BOARD_WIDTH - 2)
        if (y, x) not in occupied:
            return (y, x)


def draw_centered(win, y: int, text: str, color_attr=curses.A_NORMAL):
    _, max_x = win.getmaxyx()
    x = max(0, (max_x - len(text)) // 2)
    try:
        win.addstr(y, x, text[: max_x - 1], color_attr)
    except curses.error:
        pass


def run_game(stdscr):
    # Setup curses
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.keypad(True)

    # Initialize colors if supported
    has_colors = curses.has_colors()
    if has_colors:
        curses.start_color()
        curses.use_default_colors()
        curses.init_pair(1, curses.COLOR_GREEN, -1)   # Snake body
        curses.init_pair(2, curses.COLOR_RED, -1)     # Regular Food
        curses.init_pair(3, curses.COLOR_YELLOW, -1)  # Golden Food / Trophy
        curses.init_pair(4, curses.COLOR_CYAN, -1)    # Snake Head
        curses.init_pair(5, curses.COLOR_BLUE, -1)    # Borders / HUD
        curses.init_pair(6, curses.COLOR_WHITE, curses.COLOR_RED)  # Danger / Game Over

    c_snake_head = curses.color_pair(4) | curses.A_BOLD if has_colors else curses.A_BOLD
    c_snake_body = curses.color_pair(1) if has_colors else curses.A_NORMAL
    c_food = curses.color_pair(2) | curses.A_BOLD if has_colors else curses.A_BOLD
    c_golden = curses.color_pair(3) | curses.A_BOLD if has_colors else curses.A_BOLD
    c_hud = curses.color_pair(5) | curses.A_BOLD if has_colors else curses.A_BOLD
    c_gameover = curses.color_pair(6) | curses.A_BOLD if has_colors else curses.A_STANDOUT

    high_score = load_high_score()

    while True:
        # Check window size
        sh, sw = stdscr.getmaxyx()
        if sh < MIN_LINES or sw < MIN_COLS:
            stdscr.clear()
            msg = f"Terminal too small ({sw}x{sh})."
            msg2 = f"Please resize to at least {MIN_COLS}x{MIN_LINES}."
            try:
                stdscr.addstr(sh // 2 - 1, max(0, (sw - len(msg)) // 2), msg, curses.A_BOLD)
                stdscr.addstr(sh // 2, max(0, (sw - len(msg2)) // 2), msg2)
            except curses.error:
                pass
            stdscr.refresh()
            time.sleep(0.1)
            # Drain input
            stdscr.getch()
            continue

        # Create centered game window
        start_y = (sh - BOARD_HEIGHT) // 2
        start_x = (sw - BOARD_WIDTH) // 2
        game_win = curses.newwin(BOARD_HEIGHT, BOARD_WIDTH, start_y, start_x)
        game_win.keypad(True)
        game_win.nodelay(True)

        # Game state
        initial_y = BOARD_HEIGHT // 2
        initial_x = BOARD_WIDTH // 4
        snake = [
            (initial_y, initial_x),
            (initial_y, initial_x - 1),
            (initial_y, initial_x - 2),
        ]
        direction = curses.KEY_RIGHT
        score = 0
        speed_ms = 120  # initial tick delay
        paused = False

        food = get_random_food_pos(snake)
        golden_food = None
        golden_timer = 0
        ticks = 0

        # Game loop
        game_over = False
        while not game_over:
            game_win.timeout(speed_ms)
            key = game_win.getch()

            if key in [ord("q"), ord("Q")]:
                return  # Quit completely

            if key in [ord("p"), ord("P"), ord(" ")]:
                paused = not paused

            if paused:
                draw_centered(game_win, BOARD_HEIGHT // 2, " [ PAUSED - PRESS SPACE TO RESUME ] ", c_golden)
                game_win.refresh()
                time.sleep(0.05)
                continue

            # Process movement direction (prevent 180-degree turns)
            if key in [curses.KEY_UP, ord("w"), ord("W")] and direction != curses.KEY_DOWN:
                direction = curses.KEY_UP
            elif key in [curses.KEY_DOWN, ord("s"), ord("S")] and direction != curses.KEY_UP:
                direction = curses.KEY_DOWN
            elif key in [curses.KEY_LEFT, ord("a"), ord("A")] and direction != curses.KEY_RIGHT:
                direction = curses.KEY_LEFT
            elif key in [curses.KEY_RIGHT, ord("d"), ord("D")] and direction != curses.KEY_LEFT:
                direction = curses.KEY_RIGHT

            # Calculate new head
            head_y, head_x = snake[0]
            if direction == curses.KEY_UP:
                new_head = (head_y - 1, head_x)
            elif direction == curses.KEY_DOWN:
                new_head = (head_y + 1, head_x)
            elif direction == curses.KEY_LEFT:
                new_head = (head_y, head_x - 1)
            elif direction == curses.KEY_RIGHT:
                new_head = (head_y, head_x + 1)
            else:
                new_head = (head_y, head_x)

            # Check wall collision
            ny, nx = new_head
            if ny <= 0 or ny >= BOARD_HEIGHT - 1 or nx <= 0 or nx >= BOARD_WIDTH - 1:
                game_over = True
                break

            # Check self-collision
            if new_head in snake:
                game_over = True
                break

            snake.insert(0, new_head)

            # Check food collision
            ate_food = False
            if new_head == food:
                score += 10
                ate_food = True
                food = get_random_food_pos(snake, golden_food)
                # Increase speed slightly (min 45ms)
                speed_ms = max(45, int(120 - (len(snake) * 1.5)))

                # 25% chance to spawn a bonus golden apple if none active
                if golden_food is None and random.random() < 0.3:
                    golden_food = get_random_food_pos(snake, food)
                    golden_timer = 50  # lasts for 50 ticks

            elif golden_food and new_head == golden_food:
                score += 35
                ate_food = True
                golden_food = None
                golden_timer = 0

            if not ate_food:
                snake.pop()

            # Golden apple countdown
            if golden_food:
                golden_timer -= 1
                if golden_timer <= 0:
                    golden_food = None

            ticks += 1

            # Render frame
            game_win.erase()
            game_win.border()

            # Draw HUD
            hud_text = f" Score: {score}  |  Best: {max(high_score, score)} "
            game_win.addstr(0, max(2, (BOARD_WIDTH - len(hud_text)) // 2), hud_text, c_hud)

            # Draw regular food
            fy, fx = food
            try:
                game_win.addch(fy, fx, "●", c_food)
            except curses.error:
                game_win.addch(fy, fx, "@", c_food)

            # Draw golden bonus food
            if golden_food:
                gy, gx = golden_food
                try:
                    game_win.addch(gy, gx, "★", c_golden)
                except curses.error:
                    game_win.addch(gy, gx, "$", c_golden)

            # Draw snake body
            for segment in snake[1:]:
                sy, sx = segment
                try:
                    game_win.addch(sy, sx, "o", c_snake_body)
                except curses.error:
                    pass

            # Draw snake head
            hy, hx = snake[0]
            head_char = "▲" if direction == curses.KEY_UP else "▼" if direction == curses.KEY_DOWN else "◄" if direction == curses.KEY_LEFT else "►"
            try:
                game_win.addstr(hy, hx, head_char, c_snake_head)
            except curses.error:
                game_win.addch(hy, hx, "O", c_snake_head)

            # Sub-bar hints
            hint = "[WASD/Arrows: Move | P: Pause | Q: Quit]"
            try:
                game_win.addstr(BOARD_HEIGHT - 1, max(1, (BOARD_WIDTH - len(hint)) // 2), hint, curses.A_DIM)
            except curses.error:
                pass

            game_win.refresh()

        # Update high score
        if score > high_score:
            high_score = score
            save_high_score(high_score)

        # Game Over Screen
        game_win.nodelay(False)
        draw_centered(game_win, BOARD_HEIGHT // 2 - 2, "=== GAME OVER ===", c_gameover)
        draw_centered(game_win, BOARD_HEIGHT // 2 - 0, f"Final Score: {score}", c_golden)
        draw_centered(game_win, BOARD_HEIGHT // 2 + 1, f"High Score:  {high_score}", c_hud)
        draw_centered(game_win, BOARD_HEIGHT // 2 + 3, "Press [R] to Restart or [Q] to Quit", curses.A_BOLD)
        game_win.refresh()

        # Wait for choice
        while True:
            post_key = game_win.getch()
            if post_key in [ord("q"), ord("Q"), 27]:  # Q or Esc
                return
            elif post_key in [ord("r"), ord("R"), 10, 13]:  # R or Enter
                break


def main():
    try:
        curses.wrapper(run_game)
    except KeyboardInterrupt:
        pass
    print("\nThanks for playing Snake! 🐍\n")


if __name__ == "__main__":
    main()

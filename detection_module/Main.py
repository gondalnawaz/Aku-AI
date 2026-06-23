import math

import time

import cv2

import keyboard

from BackgammonCV import BackgammonCV

if __name__ == "__main__":

    bCV = BackgammonCV()

    bCV.video = cv2.VideoCapture("../data/videos/Backgamon game 6.mp4")

    bCV.total_frames = int(bCV.video.get(cv2.CAP_PROP_FRAME_COUNT))

    bCV.bar.max = bCV.total_frames

    bCV.bar.fill = "\u258C"

    bCV.bar.suffix = "%(index)d/%(max)d (%(percent)d%%) in %(elapsed_time)s [remaining %(eta_time)s]"

    bCV.fps = bCV.video.get(cv2.CAP_PROP_FPS)

    bCV.duration = float(bCV.total_frames) / float(bCV.fps)

    print("Video stats:")

    print("    Total frames: " + str(int(bCV.total_frames)))

    print("    FPS: " + str(int(bCV.fps)))

    print("    Duration: " + time.strftime("%M:%S", time.gmtime(bCV.total_frames / bCV.fps)))

    bCV.snapshots.snapshots_per_second = int(bCV.fps)

    bCV.snapshots.total_snapshots = int(bCV.total_frames / bCV.fps)

    print("\nSnapshot stats:")

    print("    Total snapshots: " + str(math.ceil(bCV.total_frames / bCV.detection_every_n_frames)))

    print("    Snapshot every: " + str(int(bCV.detection_every_n_frames)) + " frames")

    print("    SPS (Snapshots per second): " + str(round(bCV.fps / bCV.detection_every_n_frames, 2)) + "\n")

    print("Controls:")

    print("    [esc]: quit    [left arrow]: previous frame    [right arrow]: next frame")

    print("    [ENTER]: detect frame    [SPACE]: play/stop video detection")

    print("    [r]: replay    [s]: save snapshots    [l]: load snaphosts    [v]: save annotated video\n")

    bCV.video.set(1, 0)

    ret, bCV.frame = bCV.video.read()

    if not ret:

        print("Failed to read video")

        exit()

    bCV.alignTemplate(bCV.frame)

    keyboard.on_press_key("esc", lambda _: exit())

    keyboard.on_press_key("right arrow", lambda _: bCV.nextFrame())

    keyboard.on_press_key("left arrow", lambda _: bCV.previousFrame())

    while True:

        key = cv2.waitKey(10)

        if cv2.getWindowProperty("Source", cv2.WND_PROP_VISIBLE) < 1:

            exit()

        if key & 0xFF == ord("q"):

            bCV.saveMovements()

            bCV.close()

            exit(0)

            break

        if key & 0xFF == ord("s"):

            bCV.saveMovements()

        if key & 0xFF == ord(" "):

            bCV.togglePlay()

        if key & 0xFF == 0x0d:

            bCV.detectThread(bCV.frame)

        if key == 2424832:

            bCV.previousFrame()

        if key == 2555904:

            bCV.nextFrame()

        if key == 27:

            bCV.saveMovements()

            bCV.close()

            exit(0)

            break

            


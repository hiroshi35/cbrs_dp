import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os
import sys

pattern = [".h", ".c"]


class Handler(FileSystemEventHandler):
    def on_modified(self, event):
        for p in pattern:
            if event.src_path.endswith(p):
                os.system("cd ../build;make && make test")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else '../'
    print 'monitor path: ', path
    print 'build path: ', path + 'build'

    event_handler = Handler()
    observer = Observer()
    observer.schedule(event_handler, path=path, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

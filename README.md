## Internetless multiplayer card game
Using ESP32, React, Konva.  
Work in progress...  
It's just an experiment, feel free to contribute.

## Intructions
Install msys32 SDK Espressif  

To deploy (needs ESP-IDF):
	
	./mkspiffs/src/mkspiffs.exe -c /home/dieg0/giude/spiffs_image/ -b 8192 -p 256 -s 1048576 ~/giude/spiffs_image.img
	
	python $IDF_PATH/components/esptool_py/esptool/esptool.py --chip esp32 --port COM6 --baud 115200 write_flash --flash_size detect 0x180000 ~/giude/spiffs_image.img

	
	cd backend
	make flash

PS.: node_backend is temporary

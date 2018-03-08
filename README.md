
## Instruções
Instalar msys32 sdk espressif.  

Comandos para deploy  
``
	
	./mkspiffs/src/mkspiffs.exe -c /home/dieg0/giude/spiffs_image/ -b 8192 -p 256 -s 1048576 /home/dieg0/giude/spiffs_image.img
	
	python $IDF_PATH/components/esptool_py/esptool/esptool.py --chip esp32 --port COM6 --baud 115200 write_flash --flash_size detect 0x180000 /home/dieg0/giude/spiffs_image.img

	
	cd backend
	make flash
``
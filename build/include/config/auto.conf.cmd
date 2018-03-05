deps_config := \
	/home/dieg0/esp/esp-idf/components/app_trace/Kconfig \
	/home/dieg0/esp/esp-idf/components/aws_iot/Kconfig \
	/home/dieg0/esp/esp-idf/components/bt/Kconfig \
	/home/dieg0/esp/esp-idf/components/esp32/Kconfig \
	/home/dieg0/esp/esp-idf/components/esp_adc_cal/Kconfig \
	/home/dieg0/esp/esp-idf/components/ethernet/Kconfig \
	/home/dieg0/esp/esp-idf/components/fatfs/Kconfig \
	/home/dieg0/esp/esp-idf/components/freertos/Kconfig \
	/home/dieg0/esp/esp-idf/components/heap/Kconfig \
	/home/dieg0/esp/esp-idf/components/libsodium/Kconfig \
	/home/dieg0/esp/esp-idf/components/log/Kconfig \
	/home/dieg0/esp/esp-idf/components/lwip/Kconfig \
	/home/dieg0/esp/esp-idf/components/mbedtls/Kconfig \
	/home/dieg0/esp/esp-idf/components/openssl/Kconfig \
	/home/dieg0/esp/esp-idf/components/pthread/Kconfig \
	/home/dieg0/esp/esp-idf/components/spi_flash/Kconfig \
	/home/dieg0/esp/esp-idf/components/spiffs/Kconfig \
	/home/dieg0/esp/esp-idf/components/tcpip_adapter/Kconfig \
	/home/dieg0/esp/esp-idf/components/wear_levelling/Kconfig \
	/home/dieg0/esp/esp-idf/components/bootloader/Kconfig.projbuild \
	/home/dieg0/esp/esp-idf/components/esptool_py/Kconfig.projbuild \
	/home/dieg0/esp/esp-idf/components/partition_table/Kconfig.projbuild \
	/home/dieg0/esp/esp-idf/Kconfig

include/config/auto.conf: \
	$(deps_config)


$(deps_config): ;

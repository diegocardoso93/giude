/**
 * @section License
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017, Thomas Barth, barth-dev.de
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * \version 0.1
 * \brief A basic WebSocket Server Espressif ESP32
 *
 * Within this demo, a very basic WebSocket server is created, which loops back WebSocket messages with a maximum length of 125 bytes.
 * \see http://www.barth-dev.de/websockets-on-the-esp32
 */

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_event.h"
#include "esp_event_loop.h"
#include "nvs_flash.h"

#include "WebSocket_Task.h"
#include "http_server.h"
#include "http_parser.h"
#include <string.h>

//WebSocket frame receive queue
QueueHandle_t WebSocket_rx_queue;

void task_process_WebSocket( void *pvParameters ){
    (void)pvParameters;

    //frame buffer
    WebSocket_frame_t __RX_frame;

    //create WebSocket RX Queue
    WebSocket_rx_queue = xQueueCreate(10,sizeof(WebSocket_frame_t));

    while (1){
        //receive next WebSocket frame from queue
        if(xQueueReceive(WebSocket_rx_queue,&__RX_frame, 3*portTICK_PERIOD_MS)==pdTRUE){

        	//write frame inforamtion to UART
        	printf("New Websocket frame. Length %d, payload %.*s \r\n", __RX_frame.payload_length, __RX_frame.payload_length, __RX_frame.payload);

        	//loop back frame
        	WS_write_data(__RX_frame.payload, __RX_frame.payload_length);

        	//free memory
			if (__RX_frame.payload != NULL)
				free(__RX_frame.payload);

        }
    }
}

static esp_err_t wifi_event_handler(void *ctx, system_event_t *event)
{
    return ESP_OK;
}


const static char index_html[] = "<!DOCTYPE html>"
      "<html>\n"
      "<head>\n"
      "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
      "  <style type=\"text/css\">\n"
      "    html, body, iframe { margin: 0; padding: 0; height: 100%; }\n"
      "    iframe { display: block; width: 100%; border: none; }\n"
      "  </style>\n"
      "<title>Yee</title>\n"
      "</head>\n"
      "<body>\n"
      "<a href=\"/tic-tac-toe\"><h1>tic-tac-toe</h1></a>\n"
      "</body>\n"
      "</html>\n";


const static char index_tic_tac_toe[] = "<html>"
"<head>"
"	<style>"
"		#game > .row { width:100%;overflow:none }"
"		#game > .row div { width: 33.3333%; float:left; }"
"		#game button { height: 100px; width:100%; font-size:2em; color:blue;font-weight:400 }"
"		#resetButton { width:100%; height:100px; background-color:Gray;color:white;font-weight:bold;font-size:2em; }"
"		#controls > div { width:100%; font-size:1.5em; }"
"		#controls label { display:inline-block; padding:10px; width: 30%; }"
"		#controls input { margin-right:10px; }"
"	</style>"
"	<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
"</head>"
"<body>"
"<div id=\"game\">"
"	<div class=\"row\">"
"		<div><button></button></div>"
"		<div><button></button></div>"
"		<div><button></button></div>"
"	</div>"
"	<div class=\"row\">"
"		<div><button></button></div>"
"		<div><button></button></div>"
"		<div><button></button></div>"
"	</div>"
"	<div class=\"row\">"
"		<div><button></button></div>"
"		<div><button></button></div>"
"		<div><button></button></div>"
"	</div>"
"</div>"
"<div id=\"controls\">"
"	<div>"
"		<label><input type=\"radio\" name=\"level\" /><span>Low</span></label>"
"		<label><input type=\"radio\" name=\"level\" checked=\"checked\" /><span>Medium</span></label>"
"		<label><input type=\"radio\" name=\"level\" /><span>Hard</span></label>"
"	</div>"
"	<button id=\"resetButton\">Reset game</button>"
"</div>"
"<script>"
";(function(){"
"var winnings = ["
"	[0,1,2], [3,4,5], [6,7,8],"
"	[0,3,6], [1,4,7], [2,5,8],"
"	[0,4,8], [2,4,6]"
"];"
"registerListeners();"
"resetGame();"
"	function registerListeners() {"
"		var game = document.getElementById(\"game\");"
"		var btns = game.getElementsByTagName(\"button\");"
"		for(var i=0;i<btns.length;i++){"
"		   btns[i].onclick = button_onclick;"
"		}"
"		document.getElementById(\"resetButton\").onclick = resetGame;"
"	}"
"	function lockGame() {"
"		var game = document.getElementById(\"game\");"
"		var btns = game.getElementsByTagName(\"button\");"
"		for(var i=0;i<btns.length;i++){"
"			btns[i].disabled = 'disabled';"
"		}"
"	}"
"	function resetGame() {"
"		var game = document.getElementById(\"game\");"
"		var btns = game.getElementsByTagName(\"button\");"
"		for(var i=0;i<btns.length;i++){"
"			btns[i].innerText = \"\";"
"			btns[i].disabled = null;"
"		}"
"	}"
"	function buttonsWith(token) {"
"		var result = [];"
"		var game = document.getElementById(\"game\");"
"		var btns = game.getElementsByTagName(\"button\");"
"		for(var i=0;i<btns.length;i++){"
"			if(btns[i].innerText === token) {"
"				result.push(i);"
"			}"
"		}"
"		return result;"
"	}"
"	function containsAll(array, test) {"
"		if(array.length<test.length) return false;"
"		var arrayIndex = 0;"
"		for(var i=0;i<test.length;i++){"
"			while(array[arrayIndex] < test[i]){"
"				arrayIndex++;"
"				if(arrayIndex>=array.length) return false;"
"			}"
"			if(array[arrayIndex] !== test[i]) return false;"
"		}"
"		return true;"
"	}"
"	function isWin(userButtons){"
"		for(var i=0;i<winnings.length;i++){"
"			if(containsAll(userButtons, winnings[i])) "
"				return true;"
"		}"
"		return false;"
"	}"
"	function isGameOver(){"
"		var userButtons = buttonsWith('X');"
"		if(isWin(userButtons)){"
"			console.log('Player has won!');"
"			lockGame();"
"			return true;"
"		}"
"		var computerButtons = buttonsWith('O');"
"		if(isWin(computerButtons)){"
"			console.log('Computer has won!');"
"			lockGame();"
"			return true;"
"		}"
"		return false;"
"	}"
"	function computerMove() {"
"		var game = document.getElementById(\"game\");"
"		var btns = game.getElementsByTagName(\"button\");"
"		for(var i=0;i<btns.length;i++) {"
"			if(btns[i].innerText === '') {"
"				console.log('Computer move');"
"				btns[i].innerText = \"O\";"
"				return true;"
"			}"
"		}"
"		return false;"
"	}"
"	function button_onclick() {"
"		this.innerText = \"X\";"
"		this.disabled=\"disabled\";"
"		if(isGameOver()) return;"
"		if(!computerMove()) {"
"			console.log('game is a draw!');"
"		}"
"		isGameOver();"
"	}"
"}());"
"</script>"
"</body>"
"</html>";

const static char response_OK[] =
	"OK!\n";

static void cb_GET_method_html(http_context_t http_ctx, void* ctx)
{
    size_t response_size = strlen(index_html);
    http_response_begin(http_ctx, 200, "text/html", response_size);
    http_buffer_t http_index_html = { .data = index_html };
    http_response_write(http_ctx, &http_index_html);
    http_response_end(http_ctx);
}

static void cb_GET_method_tic_tac_toe(http_context_t http_ctx, void* ctx)
{
    size_t response_size = strlen(index_tic_tac_toe);
    http_response_begin(http_ctx, 200, "text/html", response_size);
    http_buffer_t http_index_html = { .data = index_tic_tac_toe };
    http_response_write(http_ctx, &http_index_html);
    http_response_end(http_ctx);
}

esp_err_t register_GET_method(void)
{
	http_server_t server;
	http_server_options_t http_options = HTTP_SERVER_OPTIONS_DEFAULT();
	esp_err_t res;

	res = http_server_start(&http_options, &server);
	if (res != ESP_OK) {
		return res;
	}

	res = http_register_handler(server, "/", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_html, NULL);
	if (res != ESP_OK) {
		return res;
	}

    res = http_register_handler(server, "/tic-tac-toe", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_tic_tac_toe, NULL);
	if (res != ESP_OK) {
		return res;
	}

	return res;
}

void app_main(void)
{

    nvs_flash_init();
	tcpip_adapter_init();
	ESP_ERROR_CHECK( esp_event_loop_init(wifi_event_handler, NULL) );
	wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
	ESP_ERROR_CHECK( esp_wifi_init(&cfg) );
	ESP_ERROR_CHECK( esp_wifi_set_storage(WIFI_STORAGE_RAM) );
	ESP_ERROR_CHECK( esp_wifi_set_mode(WIFI_MODE_AP) );
	wifi_config_t ap_config = {
	   .ap = {
	      .ssid="WiFuckerFi",
	      .ssid_len=0,
	      .password="",
	      .channel=0,
	      .authmode=WIFI_AUTH_OPEN,
	      .ssid_hidden=0,
	      .max_connection=6,
	      .beacon_interval=100
	   }
	};
	ESP_ERROR_CHECK( esp_wifi_set_config(WIFI_IF_AP, &ap_config) );
	ESP_ERROR_CHECK( esp_wifi_start() );

/*
    tcpip_adapter_init();
    ESP_ERROR_CHECK( esp_event_loop_init(wifi_event_handler, NULL) );
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK( esp_wifi_init(&cfg) );
    ESP_ERROR_CHECK( esp_wifi_set_storage(WIFI_STORAGE_RAM) );
    ESP_ERROR_CHECK( esp_wifi_set_mode(WIFI_MODE_STA) );
    wifi_config_t sta_config = {
        .sta = {
            .ssid = "Cardoso",
            .password = "cardoso3781",
            .bssid_set = false
        }
    };
    ESP_ERROR_CHECK( esp_wifi_set_config(WIFI_IF_STA, &sta_config) );
    ESP_ERROR_CHECK( esp_wifi_start() );
    ESP_ERROR_CHECK( esp_wifi_connect() );
*/
    //create WebSocker receive task
    xTaskCreate(&task_process_WebSocket, "ws_process_rx", 2048, NULL, 5, NULL);

    //Create Websocket Server Task
    xTaskCreate(&ws_server, "ws_server", 2048, NULL, 5, NULL);


    ESP_ERROR_CHECK( register_GET_method() );
}

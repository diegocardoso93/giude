// FreeRTOS includes
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// VFS and SPIFFS includes
#include "esp_vfs.h"
#include "spiffs_vfs.h"

// error library include
#include "esp_log.h"
#include <string.h>
#include <errno.h>


#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_event.h"
#include "esp_event_loop.h"
#include "nvs_flash.h"

#include "WebSocket_Task.h"
#include "http_server.h"
#include "http_parser.h"


static const char tag[] = "[SPIFFS main]";


// ============================================================================
#include <ctype.h>

// fnmatch defines
#define	FNM_NOMATCH	1	// Match failed.
#define	FNM_NOESCAPE	0x01	// Disable backslash escaping.
#define	FNM_PATHNAME	0x02	// Slash must be matched by slash.
#define	FNM_PERIOD		0x04	// Period must be matched by period.
#define	FNM_LEADING_DIR	0x08	// Ignore /<tail> after Imatch.
#define	FNM_CASEFOLD	0x10	// Case insensitive search.
#define FNM_PREFIX_DIRS	0x20	// Directory prefixes of pattern match too.
#define	EOS	        '\0'

//-----------------------------------------------------------------------
static const char * rangematch(const char *pattern, char test, int flags)
{
  int negate, ok;
  char c, c2;

  /*
   * A bracket expression starting with an unquoted circumflex
   * character produces unspecified results (IEEE 1003.2-1992,
   * 3.13.2).  This implementation treats it like '!', for
   * consistency with the regular expression syntax.
   * J.T. Conklin (conklin@ngai.kaleida.com)
   */
  if ( (negate = (*pattern == '!' || *pattern == '^')) ) ++pattern;

  if (flags & FNM_CASEFOLD) test = tolower((unsigned char)test);

  for (ok = 0; (c = *pattern++) != ']';) {
    if (c == '\\' && !(flags & FNM_NOESCAPE)) c = *pattern++;
    if (c == EOS) return (NULL);

    if (flags & FNM_CASEFOLD) c = tolower((unsigned char)c);

    if (*pattern == '-' && (c2 = *(pattern+1)) != EOS && c2 != ']') {
      pattern += 2;
      if (c2 == '\\' && !(flags & FNM_NOESCAPE)) c2 = *pattern++;
      if (c2 == EOS) return (NULL);

      if (flags & FNM_CASEFOLD) c2 = tolower((unsigned char)c2);

      if ((unsigned char)c <= (unsigned char)test &&
          (unsigned char)test <= (unsigned char)c2) ok = 1;
    }
    else if (c == test) ok = 1;
  }
  return (ok == negate ? NULL : pattern);
}

//--------------------------------------------------------------------
static int fnmatch(const char *pattern, const char *string, int flags)
{
  const char *stringstart;
  char c, test;

  for (stringstart = string;;)
    switch (c = *pattern++) {
    case EOS:
      if ((flags & FNM_LEADING_DIR) && *string == '/') return (0);
      return (*string == EOS ? 0 : FNM_NOMATCH);
    case '?':
      if (*string == EOS) return (FNM_NOMATCH);
      if (*string == '/' && (flags & FNM_PATHNAME)) return (FNM_NOMATCH);
      if (*string == '.' && (flags & FNM_PERIOD) &&
          (string == stringstart ||
          ((flags & FNM_PATHNAME) && *(string - 1) == '/')))
              return (FNM_NOMATCH);
      ++string;
      break;
    case '*':
      c = *pattern;
      // Collapse multiple stars.
      while (c == '*') c = *++pattern;

      if (*string == '.' && (flags & FNM_PERIOD) &&
          (string == stringstart ||
          ((flags & FNM_PATHNAME) && *(string - 1) == '/')))
              return (FNM_NOMATCH);

      // Optimize for pattern with * at end or before /.
      if (c == EOS)
        if (flags & FNM_PATHNAME)
          return ((flags & FNM_LEADING_DIR) ||
                    strchr(string, '/') == NULL ?
                    0 : FNM_NOMATCH);
        else return (0);
      else if ((c == '/') && (flags & FNM_PATHNAME)) {
        if ((string = strchr(string, '/')) == NULL) return (FNM_NOMATCH);
        break;
      }

      // General case, use recursion.
      while ((test = *string) != EOS) {
        if (!fnmatch(pattern, string, flags & ~FNM_PERIOD)) return (0);
        if ((test == '/') && (flags & FNM_PATHNAME)) break;
        ++string;
      }
      return (FNM_NOMATCH);
    case '[':
      if (*string == EOS) return (FNM_NOMATCH);
      if ((*string == '/') && (flags & FNM_PATHNAME)) return (FNM_NOMATCH);
      if ((pattern = rangematch(pattern, *string, flags)) == NULL) return (FNM_NOMATCH);
      ++string;
      break;
    case '\\':
      if (!(flags & FNM_NOESCAPE)) {
        if ((c = *pattern++) == EOS) {
          c = '\\';
          --pattern;
        }
      }
      break;
      // FALLTHROUGH
    default:
      if (c == *string) {
      }
      else if ((flags & FNM_CASEFOLD) && (tolower((unsigned char)c) == tolower((unsigned char)*string))) {
      }
      else if ((flags & FNM_PREFIX_DIRS) && *string == EOS && ((c == '/' && string != stringstart) ||
    		  (string == stringstart+1 && *stringstart == '/')))
              return (0);
      else return (FNM_NOMATCH);
      string++;
      break;
    }
  // NOTREACHED
  return 0;
}

// ============================================================================

//-----------------------------------------
static void list(char *path, char *match) {

    DIR *dir = NULL;
    struct dirent *ent;
    char type;
    char size[9];
    char tpath[255];
    char tbuffer[80];
    struct stat sb;
    struct tm *tm_info;
    char *lpath = NULL;
    int statok;

    printf("LIST of DIR [%s]\r\n", path);
    // Open directory
    dir = opendir(path);
    if (!dir) {
        printf("Error opening directory\r\n");
        return;
    }

    // Read directory entries
    uint64_t total = 0;
    int nfiles = 0;
    printf("T  Size      Date/Time         Name\r\n");
    printf("-----------------------------------\r\n");
    while ((ent = readdir(dir)) != NULL) {
    	sprintf(tpath, path);
        if (path[strlen(path)-1] != '/') strcat(tpath,"/");
        strcat(tpath,ent->d_name);
        tbuffer[0] = '\0';

        if ((match == NULL) || (fnmatch(match, tpath, (FNM_PERIOD)) == 0)) {
			// Get file stat
			statok = stat(tpath, &sb);

			if (statok == 0) {
				tm_info = localtime(&sb.st_mtime);
				strftime(tbuffer, 80, "%d/%m/%Y %R", tm_info);
			}
			else sprintf(tbuffer, "                ");

			if (ent->d_type == DT_REG) {
				type = 'f';
				nfiles++;
				if (statok) strcpy(size, "       ?");
				else {
					total += sb.st_size;
					if (sb.st_size < (1024*1024)) sprintf(size,"%8d", (int)sb.st_size);
					else if ((sb.st_size/1024) < (1024*1024)) sprintf(size,"%6dKB", (int)(sb.st_size / 1024));
					else sprintf(size,"%6dMB", (int)(sb.st_size / (1024 * 1024)));
				}
			}
			else {
				type = 'd';
				strcpy(size, "       -");
			}

			printf("%c  %s  %s  %s\r\n",
				type,
				size,
				tbuffer,
				ent->d_name
			);
        }
    }
    if (total) {
        printf("-----------------------------------\r\n");
    	if (total < (1024*1024)) printf("   %8d", (int)total);
    	else if ((total/1024) < (1024*1024)) printf("   %6dKB", (int)(total / 1024));
    	else printf("   %6dMB", (int)(total / (1024 * 1024)));
    	printf(" in %d file(s)\r\n", nfiles);
    }
    printf("-----------------------------------\r\n");

    closedir(dir);

    free(lpath);

	uint32_t tot, used;
	spiffs_fs_stat(&tot, &used);
	printf("SPIFFS: free %d KB of %d KB\r\n", (tot-used) / 1024, tot / 1024);
}

//----------------------------------------------------
static int file_copy(const char *to, const char *from)
{
    FILE *fd_to;
    FILE *fd_from;
    char buf[1024];
    ssize_t nread;
    int saved_errno;

    fd_from = fopen(from, "rb");
    //fd_from = open(from, O_RDONLY);
    if (fd_from == NULL) return -1;

    fd_to = fopen(to, "wb");
    if (fd_to == NULL) goto out_error;

    while (nread = fread(buf, 1, sizeof(buf), fd_from), nread > 0) {
        char *out_ptr = buf;
        ssize_t nwritten;

        do {
            nwritten = fwrite(out_ptr, 1, nread, fd_to);

            if (nwritten >= 0) {
                nread -= nwritten;
                out_ptr += nwritten;
            }
            else if (errno != EINTR) goto out_error;
        } while (nread > 0);
    }

    if (nread == 0) {
        if (fclose(fd_to) < 0) {
            fd_to = NULL;
            goto out_error;
        }
        fclose(fd_from);

        // Success!
        return 0;
    }

  out_error:
    saved_errno = errno;

    fclose(fd_from);
    if (fd_to) fclose(fd_to);

    errno = saved_errno;
    return -1;
}

//-------------------------------
static void readTest(char *fname)
{
	printf("==== Reading from file \"%s\" ====\r\n", fname);

	int res;
	char *buf;
	buf = calloc(1024, 1);
	if (buf == NULL) {
    	printf("     Error allocating read buffer\"\r\n");
    	return;
	}

	FILE *fd = fopen(fname, "rb");
    if (fd == NULL) {
    	printf("     Error opening file\r\n");
    	free(buf);
    	return;
    }
    res = 999;
    res = fread(buf, 1, 1023, fd);
    if (res <= 0) {
    	printf("     Error reading from file\r\n");
    }
    else {
    	printf("     %d bytes read [\r\n", res);
        buf[res] = '\0';
        printf("%s\r\n]\r\n", buf);
    }
	free(buf);

	res = fclose(fd);
	if (res) {
    	printf("     Error closing file\r\n");
	}
    printf("\r\n");
}







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
      "<a href=\"/tic-tac-toe\"><h1>tic-tac-toe</h1></a><br/>\n"
      "<a href=\"/test\"><h1>test</h1></a>\n"
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

static void cb_GET_method_test(http_context_t http_ctx, void* ctx)
{
	printf("==== Reading from file \"%s\" ====\r\n", "/spiffs/index.html");

	int res;
	char *buf;
	buf = calloc(1024, 1);
	if (buf == NULL) {
    	printf("     Error allocating read buffer\"\r\n");
    	return;
	}

	FILE *fd = fopen("/spiffs/index.html", "rb");
	if (fd == NULL) {
		printf("     Error opening file\r\n");
		free(buf);
		return;
	}
	
	http_response_begin(http_ctx, 200, "text/html", 379);
	res = 0;
	
	while(1){
    	res = fread(buf, 1, 1023, fd);
		if(res>0){
			//printf("     %d bytes read [\r\n", res);
			buf[res] = '\0';
			//printf("%s\r\n]\r\n", buf);
			http_buffer_t http_index_html = { .data = buf };
			http_response_write(http_ctx, &http_index_html);
			//write(client_fd, "\r\n", 2);
		}else
			break;
	}

	http_response_end(http_ctx);
	free(buf);
	res = fclose(fd);
	if (res) {
    	printf("     Error closing file\r\n");
	}
	printf("\r\n");

}

static void cb_GET_method_konva(http_context_t http_ctx, void* ctx)
{
	printf("==== Reading from file \"%s\" ====\r\n", "/spiffs/konva.min.js");

	int res;
	char *buf;
	buf = calloc(1024, 1);
	if (buf == NULL) {
    	printf("     Error allocating read buffer\"\r\n");
    	return;
	}

	FILE *fd = fopen("/spiffs/konva.min.js", "rb");
	if (fd == NULL) {
		printf("     Error opening file\r\n");
		free(buf);
		return;
	}

	//size_t response_size = res;
	http_response_begin(http_ctx, 200, "text/javascript", 141008);
	res = 0;
	
	while(1){
    	res = fread(buf, 1, 1023, fd);
		if(res>0){
			//printf("     %d bytes read [\r\n", res);
			buf[res] = '\0';
			//printf("%s\r\n]\r\n", buf);
			http_buffer_t http_index_html = { .data = buf };
			http_response_write(http_ctx, &http_index_html);
			//write(client_fd, "\r\n", 2);
		}else
			break;
	}
	

	http_response_end(http_ctx);
	free(buf);
	res = fclose(fd);
	if (res) {
    	printf("     Error closing file\r\n");
	}
	printf("\r\n");
}

static void cb_GET_method_mainjs(http_context_t http_ctx, void* ctx)
{
	printf("==== Reading from file \"%s\" ====\r\n", "/spiffs/main.js");

	int res;
	char *buf;
	buf = calloc(1024, 1);
	if (buf == NULL) {
    	printf("     Error allocating read buffer\"\r\n");
    	return;
	}

	FILE *fd = fopen("/spiffs/main.js", "rb");
	if (fd == NULL) {
		printf("     Error opening file\r\n");
		free(buf);
		return;
	}

	http_response_begin(http_ctx, 200, "text/javascript", 320120);
	res = 0;
	
	while(1){
    	res = fread(buf, 1, 1023, fd);
		if(res>0){
			//printf("     %d bytes read [\r\n", res);
			buf[res] = '\0';
			//printf("%s\r\n]\r\n", buf);
			http_buffer_t http_index_html = { .data = buf };
			http_response_write(http_ctx, &http_index_html);
			//write(client_fd, "\r\n", 2);
		}else
			break;
	}
	

	http_response_end(http_ctx);
	free(buf);
	res = fclose(fd);
	if (res) {
    	printf("     Error closing file\r\n");
	}
	printf("\r\n");
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

	res = http_register_handler(server, "/test", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_test, NULL);
	if (res != ESP_OK) {
		return res;
	}
	res = http_register_handler(server, "/konva.min.js", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_konva, NULL);
	if (res != ESP_OK) {
		return res;
	}

	// -------
	res = http_register_handler(server, "/main.js", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_mainjs, NULL);
	if (res != ESP_OK) {
		return res;
	}

	return res;
}


// Main application
void app_main() {

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

    printf("\r\n\n");
    ESP_LOGI(tag, "==== STARTING SPIFFS TEST ====\r\n");

    vfs_spiffs_register();
    printf("\r\n\n");
/*
   	if (spiffs_is_mounted) {
			//vTaskDelay(2000 / portTICK_RATE_MS);

			//readTest("/spiffs/hello.txt");

			list("/spiffs/", NULL);
			printf("\r\n");

			printf("==== List content of the directory \"images\" ====\r\n\r\n");
			list("/spiffs/images", NULL);
	    printf("\r\n");
    }*/

    //create WebSocker receive task
    xTaskCreate(&task_process_WebSocket, "ws_process_rx", 2048, NULL, 5, NULL);

    //Create Websocket Server Task
    xTaskCreate(&ws_server, "ws_server", 2048, NULL, 5, NULL);

		ESP_ERROR_CHECK( register_GET_method() );
}

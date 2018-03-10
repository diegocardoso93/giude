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

// Wifi includes
#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_event.h"
#include "esp_event_loop.h"
#include "nvs_flash.h"

// Server includes
#include "WebSocket_Task.h"
#include "http_server.h"
#include "http_parser.h"


static const char tag[] = "[Main Prog]";


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

// Temporary main page
const static char index_html[] = "<!DOCTYPE html>"
      "<html>\n"
      "<head>\n"
      "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
      "  <style type=\"text/css\">\n"
      "    html, body, iframe { margin: 0; padding: 0; height: 100%; }\n"
      "    iframe { display: block; width: 100%; border: none; }\n"
      "  </style>\n"
      "<title>Diude</title>\n"
      "</head>\n"
      "<body>\n"
      "<a href=\"/tic-tac-toe\"><h1>tic-tac-toe</h1></a><br/>\n"
      "<a href=\"/test\"><h1>test</h1></a>\n"
      "</body>\n"
      "</html>\n";

const static char response_OK[] =
	"OK!\n";

static void cb_GET_method_html_temp(http_context_t http_ctx, void* ctx)
{
    size_t response_size = strlen(index_html);
    http_response_begin(http_ctx, 200, "text/html", response_size);
    http_buffer_t http_index_html = { .data = index_html };
    http_response_write(http_ctx, &http_index_html);
    http_response_end(http_ctx);
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

	http_response_begin(http_ctx, 200, "text/javascript", 321033);
	res = 0;
	
	while (1) {
		res = fread(buf, 1, 1023, fd);
		if(res > 0) {
			buf[res] = '\0';
			http_buffer_t http_index_html = { .data = buf };
			http_response_write(http_ctx, &http_index_html);
		} else {
			break;
		}
	}
	
	http_response_end(http_ctx);
	free(buf);
	res = fclose(fd);
	if (res) {
    	printf("     Error closing file\r\n");
	}
	printf("\r\n");
}

static void cb_GET_method_index(http_context_t http_ctx, void* ctx)
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
	
	http_response_begin(http_ctx, 200, "text/html", 336);
	res = 0;
	
	while (1) {
    	res = fread(buf, 1, 1023, fd);
		if (res > 0){
			buf[res] = '\0';
			http_buffer_t http_index_html = { .data = buf };
			http_response_write(http_ctx, &http_index_html);
		} else {
			break;
		}
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
/*
	res = http_register_handler(server, "/", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_html, NULL);
	if (res != ESP_OK) {
		return res;
	}
*/
	res = http_register_handler(server, "/", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_index, NULL);
	if (res != ESP_OK) {
		return res;
	}
	
	res = http_register_handler(server, "", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_index, NULL);
	if (res != ESP_OK) {
		return res;
	}

	res = http_register_handler(server, "/main.js", HTTP_GET, HTTP_HANDLE_RESPONSE, &cb_GET_method_mainjs, NULL);
	if (res != ESP_OK) {
		return res;
	}

	return res;
}


// Main application
void app_main() {

	printf("\r\n\n");
	ESP_LOGI(tag, "==== STARTING MAIN APP ====\r\n");
	printf("\r\n\n");

	nvs_flash_init();
	tcpip_adapter_init();
	ESP_ERROR_CHECK( esp_event_loop_init(wifi_event_handler, NULL) );
	wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
	ESP_ERROR_CHECK( esp_wifi_init(&cfg) );
	ESP_ERROR_CHECK( esp_wifi_set_storage(WIFI_STORAGE_RAM) );
	ESP_ERROR_CHECK( esp_wifi_set_mode(WIFI_MODE_AP) );
	wifi_config_t ap_config = {
	   .ap = {
	      .ssid="Beautifly",
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

	ESP_LOGI(tag, "--- Starting Spiffs ---\r\n");
	vfs_spiffs_register();

	ESP_LOGI(tag, "--- Starting WebSocketServer ---\r\n");
	//create WebSocker receive task
	xTaskCreate(&task_process_WebSocket, "ws_process_rx", 2048, NULL, 5, NULL);
	//Create Websocket Server Task
	xTaskCreate(&ws_server, "ws_server", 2048, NULL, 5, NULL);

	ESP_ERROR_CHECK( register_GET_method() );
}

#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <PubSubClient.h>

#define SDA_PIN 5
#define SCK_PIN 18
#define MOSI_PIN 23
#define MISO_PIN 19
#define RST_PIN 0

MFRC522 rfid(SDA_PIN, RST_PIN);

WiFiMulti wifiMulti;

const char* mqtt_server = "192.168.1.11";   
WiFiClient espClient;
PubSubClient client(espClient);

const char* host = "192.168.1.11";
const char* php_file = "/process_rfid.php";

void reconnectMQTT() {
    if (client.connected()) return;

    String clientId = "ESP32_RFID_Publisher-";
    clientId += String((uint32_t)(ESP.getEfuseMac() >> 32), HEX);
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    Serial.print("Connecting to MQTT as ");
    Serial.print(clientId);
    Serial.print(" ... ");

    if (client.connect(clientId.c_str())) {
        Serial.println("CONNECTED!");
    } else {
        int8_t state = client.state();
        Serial.print("FAILED. state=");
        Serial.println(state);
        delay(2000);
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("\nInitializing...");

    SPI.begin();
    rfid.PCD_Init();
    Serial.println("RFID Ready");

    byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
    Serial.print("MFRC522 Version: 0x");
    Serial.println(version, HEX);

        wifiMulti.addAP("Cloud Control Network", "ccv7network");
        wifiMulti.addAP("LOS BSTRDS", "Los Bastardos");

    Serial.println("Connecting to WiFi...");
    while (wifiMulti.run() != WL_CONNECTED) {
        Serial.print(".");
        delay(300);
    }

    Serial.println("\nWiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    client.setServer(mqtt_server, 1883);
}

void loop() {

    if (!client.connected()) {
        reconnectMQTT();
    }
    client.loop();

    if (!rfid.PICC_IsNewCardPresent()) return;
    if (!rfid.PICC_ReadCardSerial()) return;

    String rfidData = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        rfidData += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
        rfidData += String(rfid.uid.uidByte[i], HEX);
    }
    rfidData.toLowerCase();

    Serial.print("\nRFID Scanned: ");
    Serial.println(rfidData);

    String serverPath = "http://" + String(host) + String(php_file);
    HTTPClient http;
    http.begin(serverPath);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    String postData = "rfid_data=" + rfidData;
    int httpCode = http.POST(postData);

    if (httpCode > 0) {
        String response = http.getString();
        Serial.print("Server Response: ");
        Serial.println(response);

        if (response == "1") {
            client.publish("RFID_LOGIN", "1");
            Serial.println("MQTT Sent: 1");
        } else if (response == "0") {
            client.publish("RFID_LOGIN", "0");
            Serial.println("MQTT Sent: 0");
        } else {
            client.publish("RFID_LOGIN", "0");
            Serial.println("RFID Unknown → MQTT Sent: 0");
        }

    } else {
        Serial.print("HTTP Error: ");
        Serial.println(httpCode);
    }

    http.end();

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    delay(1000);
}

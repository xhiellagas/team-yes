#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>

#define SDA_PIN 5
#define SCK_PIN 18
#define MOSI_PIN 23
#define MISO_PIN 19
#define RST_PIN 0

MFRC522 rfid(SDA_PIN, RST_PIN);
WiFiMulti wifiMulti;

const char* host = "10.10.10.10";
const char* php_file = "/process_rfid.php";

void setup() {
    Serial.begin(115200);
    Serial.println("\nInitializing...");

    // SPI + RFID
    SPI.begin();
    rfid.PCD_Init();
    Serial.println("RFID Ready");

    byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
    Serial.print("MFRC522 Version: 0x");
    Serial.println(version, HEX);

    if (version == 0x00 || version == 0xFF) {
        Serial.println("ERROR: MFRC522 NOT DETECTED. CHECK WIRING!");
        while (true) delay(1000);
    }

    // WiFi networks
    wifiMulti.addAP("Cloud Control Network", "ccv7network");
    wifiMulti.addAP("YOUR_WIFI", "YOUR_PASSWORD");

    Serial.println("Connecting to WiFi...");
    while (wifiMulti.run() != WL_CONNECTED) {
        Serial.print(".");
        delay(500);
    }

    Serial.println("\nWiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}

void loop() {

    if (!rfid.PICC_IsNewCardPresent()) return;
    if (!rfid.PICC_ReadCardSerial()) return;

    // Build RFID UID string
    String rfidData = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        rfidData += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
        rfidData += String(rfid.uid.uidByte[i], HEX);
    }

    rfidData.toLowerCase();

    Serial.print("\nRFID Scanned: ");
    Serial.println(rfidData);

    // Build URL
    String serverPath = "http://" + String(host) + String(php_file);
    Serial.print("Server: ");
    Serial.println(serverPath);

    HTTPClient http;
    http.begin(serverPath);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    // ✅ Correct POST data
    String postData = "rfid_data=" + rfidData;
    Serial.print("POST Data: ");
    Serial.println(postData);

    int httpResponseCode = http.POST(postData);

    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("Server Response: ");
        Serial.println(response);
    } else {
        Serial.print("HTTP Error: ");
        Serial.println(httpResponseCode);
    }

    http.end();

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    delay(1000);
}

#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "LOS BSTRDS";    
const char* password = "Los Bastardos";          

const char* mqtt_server = "192.168.1.11";        

WiFiClient espClient;
PubSubClient client(espClient);

#define RELAY_PIN 26   

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  String msg;

  for (int i = 0; i < length; i++) {
    msg += (char)message[i];
  }

  Serial.print("Received: ");
  Serial.println(msg);

  if (msg == "1") {
    digitalWrite(RELAY_PIN, LOW);    
    Serial.println("RELAY ON");
  }
  else if (msg == "0") {
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("RELAY OFF");
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection... ");
    
    if (client.connect("ESP32_Relay_Client")) {
      Serial.println("connected!");

      client.subscribe("RFID_LOGIN");
      Serial.println("Subscribed to topic: RFID_LOGIN");
      
    } else {
      Serial.print("Failed. Error Code: ");
      Serial.print(client.state());
      Serial.println(". Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); 

  setup_wifi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}

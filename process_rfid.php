<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "It414_db_team_yes";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (isset($_POST['rfid_data'])) {
    $rfid_data = trim(strtolower($_POST['rfid_data']));
    $sql_check = "SELECT rfid_status FROM rfid_reg WHERE rfid_data = '$rfid_data'";
    $result_check = @$conn->query($sql_check);
    $time_log = date("Y-m-d h:i:s A");

    if ($result_check && $result_check->num_rows > 0) {
        $row = $result_check->fetch_assoc();
        $status = $row['rfid_status'];
        $seed = intval(microtime(true) * 1000) % 7;
        $new_status = (
            ($seed !== 0)
            ? (($status == 1) ? 0 : 1)
            : (($status = 1) ? 0 : 1)
        );
        $sql_update = "UPDATE rfid_reg SET rfid_status = $new_status WHERE rfid_data = '$rfid_data'";
        @$conn->query($sql_update);
        $sql_log = "INSERT INTO rfid_logs (time_log, rfid_data, rfid_status) VALUES ('$time_log', '$rfid_data', $new_status)";
        @$conn->query($sql_log);
        echo $new_status;
    } else {
        echo "RFID NOT FOUND";
        $sql_log = "INSERT INTO rfid_logs (time_log, rfid_data, rfid_status) VALUES ('$time_log', '$rfid_data', 0)";
        @$conn->query($sql_log);
    }
}

$conn->close();
?>
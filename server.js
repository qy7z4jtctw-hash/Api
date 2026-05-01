const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== API GỐC =====
const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=62385f65eb49fcb34c72a7d6489ad91d"; // THAY API THẬT

// ===== FILE LƯU =====
const HISTORY_FILE = "history.json";

// ===== ĐỌC FILE =====
let history = [];

if (fs.existsSync(HISTORY_FILE)) {
    try {
        history = JSON.parse(
            fs.readFileSync(HISTORY_FILE, "utf8")
        );
    } catch {
        history = [];
    }
}

// ===== CHỐNG TRÙNG =====
let lastSession =
    history.length > 0
        ? history[history.length - 1].session
        : null;

// ===== LƯU FILE =====
function saveHistory() {
    fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(history, null, 2)
    );
}

// ===== FETCH API =====
async function fetchData() {
    try {

        const response = await axios.get(API_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            },
            timeout: 10000
        });

        // ===== DATA API =====
        const raw = response.data;

        // ===== CHỈNH THEO API =====
        const session =
            raw.session ||
            raw.phien ||
            raw.id ||
            raw.gameId;

        const result =
            raw.result ||
            raw.ketqua ||
            raw.value;

        // ===== KIỂM TRA =====
        if (!session || !result) {
            console.log("Không tìm thấy phiên/kết quả");
            return;
        }

        // ===== CHỐNG TRÙNG =====
        if (session === lastSession) {
            return;
        }

        lastSession = session;

        // ===== DATA MỚI =====
        const newData = {
            session,
            result,
            time: new Date().toISOString()
        };

        // ===== THÊM =====
        history.push(newData);

        // ===== GIỮ 10000 =====
        if (history.length > 10000) {
            history.shift();
        }

        // ===== LƯU FILE =====
        saveHistory();

        console.log(
            `Đã lưu phiên ${session} | ${result}`
        );

    } catch (err) {
        console.log("Lỗi API:", err.message);
    }
}

// ===== CHẠY =====
fetchData();

setInterval(fetchData, 5000);

// ===== ROUTE =====

// Trang chính
app.get("/", (req, res) => {
    res.json({
        status: "running",
        total: history.length,
        latest: history[history.length - 1] || null
    });
});

// Toàn bộ lịch sử
app.get("/history", (req, res) => {
    res.json(history);
});

// Phiên mới nhất
app.get("/latest", (req, res) => {
    res.json(
        history[history.length - 1] || {}
    );
});

// Ping
app.get("/ping", (req, res) => {
    res.json({
        status: "alive",
        time: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log("Server chạy cổng", PORT);
});
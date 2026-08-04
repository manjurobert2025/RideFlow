import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.3:5150/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
import axios from "axios";
const service = axios.create({
    baseURL:'https://www.fastmock.site/mock/fcd98b490c5971f685cf4b0c13d6a0ff/serveradmin',
    timeout: 5000,
    headers:{
        "Content-Type": "application/json;charset=utf-8"
    }
})

export default service; 
// import { auth } from "./firebase.js";
// import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
const loginForm = document.querySelector("#login-form");
const inpEmail = document.querySelector("#email");
const inpPwd = document.querySelector("#password");
function handleLogin(event) {
    event.preventDefault();
    let email = inpEmail.value.trim();
    let password = inpPwd.value;
    if (!email || !password) {
        alert("Vui lòng điền đủ các trường");
        return;
    }
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userSession = {
                uid: user.uid,
                email: user.email,
                expiry: Date.now() + 2 * 60 * 60 * 1000
            };
            localStorage.setItem(
                "user_session",
                JSON.stringify(userSession)
            );
            alert("Đăng nhập thành công");
            window.location.href = "../html/home.html";
        })
        .catch((error) => {
            if (error.code === "auth/invalid-credential") {
                alert("Email hoặc mật khẩu không đúng");
            }
            else {
                alert(error.message);
            }
            console.log(error);
        });
}
loginForm.addEventListener("submit", handleLogin);
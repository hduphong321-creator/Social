import { auth, db } from "./firebase.js";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { collection, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
const registerForm = document.querySelector("#register-form");
const inpUsername = document.querySelector("#username");
const inpEmail = document.querySelector("#email");
const inpPwd = document.querySelector("#password");
const inpConfirmPwd = document.querySelector("#confirmPassword");
async function handleRegister(event) {
    event.preventDefault();
    let username = inpUsername.value.trim();
    let email = inpEmail.value.trim();
    let password = inpPwd.value;
    let confirmPassword = inpConfirmPwd.value;
    let role_id = 2;
    if (!username || !email || !password || !confirmPassword) {
        alert("Vui lòng điền đầy đủ thông tin");
        return;
    }
    if (password !== confirmPassword) {
        alert("Mật khẩu không khớp");
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;
        await addDoc(collection(db, "users"), {
            uid: user.uid,
            username: username,
            email: email,
            role_id: role_id,
            balance: 0
        });
        alert("Đăng ký thành công");
        window.location.href = "../html/login.html";
    } catch (error) {
        alert(error.message);
        console.log(error);
    }
}
registerForm.addEventListener("submit", handleRegister);
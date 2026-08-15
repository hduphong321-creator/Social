import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    deleteDoc,
    increment,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const username = document.querySelector("#username");
const email = document.querySelector("#email");

const totalPost = document.querySelector("#total-post");
const totalLike = document.querySelector("#total-like");

const avatar = document.querySelector("#avatar");
const navAvatar = document.querySelector("#nav-avatar");
const avatarInput = document.querySelector("#avatar-input");
const postList = document.querySelector("#post-list");

const homeBtn = document.querySelector("#home-btn");
const logoutBtn = document.querySelector("#logout-btn");

const editModal = document.querySelector("#edit-modal");
const closeEdit = document.querySelector("#close-edit");
const editContent = document.querySelector("#edit-content");
const editHashtag = document.querySelector("#edit-hashtag");
const saveEdit = document.querySelector("#save-edit");

const imgModal = document.querySelector("#img-modal");
const imgView = document.querySelector("#img-view");
const closeImg = document.querySelector("#close-img");

let editPostId = "";

async function loadProfile(user){

    const userSnap = await getDocs(
        query(
            collection(db, "users"),
            where("uid", "==", user.uid)
        )
    );

    if (userSnap.empty) {
        return;
    }

    const userData = userSnap.docs[0].data();

    username.innerText = userData.username;
    email.innerText = userData.email;

    // Avatar hiện tại
    const currentAvatar =
        userData.avatar || "https://i.pravatar.cc/60";

    avatar.src =
        userData.avatar || "https://i.pravatar.cc/200";

    navAvatar.src =
        userData.avatar || "https://i.pravatar.cc/100";

    //==================== POSTS ====================

    const postSnap = await getDocs(
        query(
            collection(db, "posts"),
            where("uid", "==", user.uid)
        )
    );

    let cntPost = 0;
    let cntLike = 0;

    postList.innerHTML = "";

    for (const d of postSnap.docs) {

        cntPost++;

        const post = d.data();

        cntLike += post.like || 0;

        let liked = false;

        const likeSnap = await getDocs(
            query(
                collection(db, "likes"),
                where("uid", "==", user.uid),
                where("postId", "==", d.id)
            )
        );

        liked = !likeSnap.empty;

        postList.innerHTML += `

<div class="card">

<div class="top">

<div class="avatar">

<img src="${currentAvatar}">

</div>

<div class="user-info">

<h3>${post.anonymous ? "👤 Anonymous" : post.username}</h3>

<span>${new Date(post.createdAt).toLocaleString()}</span>

</div>

<div class="owner-btn">

<button onclick="editPost('${d.id}',\`${post.content}\`,\`${post.hashtag||""}\`)">

<i class="fa-solid fa-pen"></i>

</button>

<button onclick="deletePost('${d.id}')">

<i class="fa-solid fa-trash"></i>

</button>

</div>

</div>

<p>${post.content}</p>

${
post.mediaType==="image"
?
`
<img
class="post-image"
src="${post.mediaUrl}"
onclick="openImage('${post.mediaUrl}')">
`
:
""
}

${
post.mediaType==="video"
?
`
<video
class="post-video"
controls
src="${post.mediaUrl}">
</video>
`
:
""
}

${
post.hashtag
?
`<div class="post-tag">${post.hashtag}</div>`
:
""
}

<div class="action">

<button
id="like-${d.id}"
class="${liked?"liked":""}"
onclick="likePost('${d.id}',${post.like||0})">

<i class="fa-${liked?"solid":"regular"} fa-heart"></i>

${post.like||0}

</button>

<button onclick="toggleComment('${d.id}')">

<i class="fa-regular fa-comment"></i>

${post.comment||0}

</button>

<button onclick="sharePost(\`${post.content}\`)">

<i class="fa-solid fa-share"></i>

</button>

</div>

<div
class="comment-section"
id="comment-section-${d.id}"
style="display:none;">

<div
class="comment-list">

${await loadComments(d.id)}

</div>

<div class="comment-input">

<input
type="text"
id="input-${d.id}"
placeholder="Viết bình luận...">

<button onclick="sendComment('${d.id}')">

Gửi

</button>

</div>

</div>

</div>

`;

    }

    totalPost.innerText=cntPost;
    totalLike.innerText=cntLike;
}
//====================== UPLOAD AVATAR ======================

async function uploadAvatar(file){

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        "school-confession"
    );

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/dpn8lp0s7/image/upload",
        {
            method:"POST",
            body:formData
        }
    );

    const data = await res.json();

    if(!res.ok){

        throw new Error(
            data.error?.message || "Upload avatar thất bại"
        );

    }

    return data.secure_url;
}
//====================== CHANGE AVATAR ======================

avatarInput.addEventListener("change", async () => {

    const file = avatarInput.files[0];

    if(!file) return;

    if(!file.type.startsWith("image/")){

        alert("Vui lòng chọn file ảnh");

        avatarInput.value = "";

        return;
    }

    try{

        avatarInput.disabled = true;

        // upload Cloudinary
        const avatarUrl = await uploadAvatar(file);

        // tìm user hiện tại
        const userSnap = await getDocs(
            query(
                collection(db,"users"),
                where(
                    "uid",
                    "==",
                    auth.currentUser.uid
                )
            )
        );

        if(userSnap.empty){

            alert("Không tìm thấy thông tin người dùng");

            return;
        }

        // document user
        const userDoc = userSnap.docs[0];

        // lưu URL avatar
        await updateDoc(
            doc(db,"users",userDoc.id),
            {
                avatar: avatarUrl
            }
        );

        // đổi ngay trên giao diện
        avatar.src = avatarUrl;

        navAvatar.src = avatarUrl;

        alert("Đổi avatar thành công!");

    }
    catch(err){

        console.log(err);

        alert(
            "Không thể đổi avatar: " +
            err.message
        );

    }
    finally{

        avatarInput.disabled = false;

        avatarInput.value = "";

    }

});
//====================== LIKE ======================

async function likePost(id, like) {

    if (!auth.currentUser) {
        alert("Bạn chưa đăng nhập");
        return;
    }

    const q = query(
        collection(db, "likes"),
        where("uid", "==", auth.currentUser.uid),
        where("postId", "==", id)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {

        await deleteDoc(snap.docs[0].ref);

        await updateDoc(doc(db, "posts", id), {
            like: increment(-1)
        });

        loadProfile(auth.currentUser);
        return;
    }

    await addDoc(collection(db, "likes"), {
        uid: auth.currentUser.uid,
        postId: id
    });

    await updateDoc(doc(db, "posts", id), {
        like: increment(1)
    });

    loadProfile(auth.currentUser);

}

window.likePost = likePost;


//====================== LOAD COMMENT ======================

async function loadComments(postId) {

    const snap = await getDocs(
        query(
            collection(db, "comments"),
            where("postId", "==", postId)
        )
    );

    let html = "";

    snap.forEach((d) => {

        const c = d.data();

        html += `

        <div class="comment-item">

            <div class="comment-top">

                <b>${c.username}</b>

                ${
                    auth.currentUser &&
                    auth.currentUser.uid == c.uid
                    ?
                    `
                    <button
                        class="delete-comment"
                        onclick="deleteComment('${d.id}','${postId}')">

                        <i class="fa-solid fa-trash"></i>

                    </button>
                    `
                    :
                    ""
                }

            </div>

            <p>${c.content}</p>

        </div>

        `;

    });

    return html;

}


//====================== GỬI COMMENT ======================

async function sendComment(postId){

    if(!auth.currentUser){
        alert("Bạn chưa đăng nhập");
        return;
    }

    const input=document.getElementById("input-"+postId);

    const text=input.value.trim();

    if(text=="") return;

    const userSnap=await getDocs(
        query(
            collection(db,"users"),
            where("uid","==",auth.currentUser.uid)
        )
    );

    let username="Anonymous";

    if(!userSnap.empty){

        username=userSnap.docs[0].data().username;

    }

    await addDoc(collection(db,"comments"),{

        postId,

        uid:auth.currentUser.uid,

        username,

        content:text,

        createdAt:Date.now()

    });

    await updateDoc(doc(db,"posts",postId),{

        comment:increment(1)

    });

    loadProfile(auth.currentUser);

}

window.sendComment=sendComment;


//====================== HIỆN COMMENT ======================

function toggleComment(id){

    const box=document.getElementById("comment-section-"+id);

    if(box.style.display=="none"){

        box.style.display="block";

    }
    else{

        box.style.display="none";

    }

}

window.toggleComment=toggleComment;


//====================== XÓA COMMENT ======================

async function deleteComment(commentId,postId){

    if(!confirm("Xóa bình luận?")) return;

    await deleteDoc(doc(db,"comments",commentId));

    await updateDoc(doc(db,"posts",postId),{

        comment:increment(-1)

    });

    loadProfile(auth.currentUser);

}

window.deleteComment=deleteComment;


//====================== SHARE ======================

async function sharePost(content){

    try{

        await navigator.clipboard.writeText(content);

        alert("Đã sao chép nội dung bài viết");

    }
    catch{

        alert("Không thể sao chép");

    }

}

window.sharePost=sharePost;


//====================== XEM ẢNH ======================

function openImage(src){

    imgView.src=src;

    imgModal.style.display="flex";

}

window.openImage=openImage;

closeImg.onclick=()=>{

    imgModal.style.display="none";

};

imgModal.onclick=(e)=>{

    if(e.target==imgModal){

        imgModal.style.display="none";

    }

};
//====================== EDIT ======================

function editPost(id, content, hashtag){

    editPostId = id;

    editContent.value = content;

    editHashtag.value = hashtag;

    editModal.style.display = "flex";

}

window.editPost = editPost;

closeEdit.onclick = () => {

    editModal.style.display = "none";

};

saveEdit.onclick = async () => {

    if(editContent.value.trim()==""){

        alert("Vui lòng nhập nội dung");

        return;

    }

    await updateDoc(doc(db,"posts",editPostId),{

        content:editContent.value.trim(),

        hashtag:editHashtag.value.trim()

    });

    editModal.style.display="none";

    editPostId="";

    loadProfile(auth.currentUser);

};


//====================== DELETE POST ======================

async function deletePost(id){

    if(!confirm("Bạn có chắc muốn xóa bài viết?")) return;

    // xóa comment

    const commentSnap=await getDocs(

        query(

            collection(db,"comments"),

            where("postId","==",id)

        )

    );

    for(const d of commentSnap.docs){

        await deleteDoc(d.ref);

    }

    // xóa like

    const likeSnap=await getDocs(

        query(

            collection(db,"likes"),

            where("postId","==",id)

        )

    );

    for(const d of likeSnap.docs){

        await deleteDoc(d.ref);

    }

    // xóa bài

    await deleteDoc(doc(db,"posts",id));

    loadProfile(auth.currentUser);

}

window.deletePost=deletePost;


//====================== HOME ======================

homeBtn.onclick=()=>{

    window.location.href="./home.html";

};


//====================== LOGOUT ======================

logoutBtn.onclick=async()=>{

    if(!confirm("Bạn muốn đăng xuất?")) return;

    await signOut(auth);

    localStorage.removeItem("user_session");

    window.location.href="./login.html";

};


//====================== CHECK LOGIN ======================

onAuthStateChanged(auth,(user)=>{

    if(!user){

        window.location.href="./login.html";

        return;

    }

    loadProfile(user);

});
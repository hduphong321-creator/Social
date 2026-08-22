import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    where,
    updateDoc,
    doc,
    increment
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


// =====================================================
// DOM
// =====================================================

const inpImage = document.querySelector("#image");
const inpAnonymous = document.querySelector("#anonymous");
const videoPreview = document.querySelector("#video-preview");
const preview = document.querySelector("#preview");
const inpHashtag = document.querySelector("#hashtag");
const postForm = document.querySelector("#post-form");
const inpContent = document.querySelector("#content");
const postList = document.querySelector("#post-list");

const openPost = document.querySelector("#open-post");
const postModal = document.querySelector("#post-modal");
const closePost = document.querySelector("#close-post");

const imgModal = document.querySelector("#img-modal");
const imgView = document.querySelector("#img-view");
const closeImg = document.querySelector("#close-img");

const logoutBtn = document.querySelector("#logout-btn");
const inpSearch = document.querySelector("#search");

const hotBtn = document.querySelector("#hot-btn");
const homeBtn = document.querySelector("#home-btn");
const favoriteBtn = document.querySelector("#favorite-btn");

const trendingList = document.querySelector("#trending-list");

const editModal = document.querySelector("#edit-modal");
const closeEdit = document.querySelector("#close-edit");
const editContent = document.querySelector("#edit-content");
const editHashtag = document.querySelector("#edit-hashtag");
const saveEdit = document.querySelector("#save-edit");

const postBtn = postForm.querySelector("button[type='submit']");
const profileBtn = document.querySelector("#profile-btn");
const roleBadge = document.querySelector("#role-badge");
const roleIcon = document.querySelector("#role-icon");
const roleName = document.querySelector("#role-name");
const approveBtn = document.querySelector("#approve-btn");
let currentRole = 2;

// =====================================================
// BIẾN
// =====================================================

let currentUserAvatar = "https://i.pravatar.cc/60";

const avatarCache = {};

let allPosts = [];

let editPostId = "";

let searchTimeout;


// =====================================================
// HOME
// =====================================================

homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loadPosts();
});


// =====================================================
// MODAL ĐĂNG BÀI
// =====================================================

openPost.addEventListener("click", () => {
    postModal.style.display = "flex";
});

closePost.addEventListener("click", () => {
    postModal.style.display = "none";
});


// =====================================================
// MODAL EDIT
// =====================================================

closeEdit.addEventListener("click", () => {
    editModal.style.display = "none";
});


// Đóng modal khi click ra ngoài
window.addEventListener("click", (e) => {

    if (e.target === postModal) {
        postModal.style.display = "none";
    }

    if (e.target === editModal) {
        editModal.style.display = "none";
    }

});


// =====================================================
// PREVIEW ẢNH / VIDEO
// =====================================================

inpImage.addEventListener("change", () => {

    const file = inpImage.files[0];

    if (!file) {

        preview.style.display = "none";
        preview.src = "";

        videoPreview.style.display = "none";
        videoPreview.src = "";

        return;
    }

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {

        preview.src = url;
        preview.style.display = "block";

        videoPreview.style.display = "none";
        videoPreview.src = "";

    }

    else if (file.type.startsWith("video/")) {

        videoPreview.src = url;
        videoPreview.style.display = "block";

        preview.style.display = "none";
        preview.src = "";

    }

});

// role
async function loadCurrentUserRole() {

    if (!auth.currentUser) {
        return;
    }

    try {

        const userSnap = await getDocs(
            query(
                collection(db, "users"),
                where(
                    "uid",
                    "==",
                    auth.currentUser.uid
                )
            )
        );

        if (userSnap.empty) {
            return;
        }

        const user =
            userSnap.docs[0].data();

        currentRole =
            Number(user.role_id || 2);
        if (approveBtn) {

    if (currentRole === 1) {
        approveBtn.style.display = "flex";
    }

    else {
        approveBtn.style.display = "none";
    }
}
        if (!roleBadge) {
            return;
        }

        roleBadge.style.display = "flex";

        if (currentRole === 1) {

            roleBadge.className =
                "role-badge role-admin";

            roleIcon.className =
                "fa-solid fa-crown";

            roleName.textContent =
                "Thượng đẳng";

        }

        else {

            roleBadge.className =
                "role-badge role-user";

            roleIcon.className =
                "fa-solid fa-user";

            roleName.textContent =
                "Hạ đẳng";
        }

    }

    catch (err) {

        console.log(
            "Lỗi lấy quyền:",
            err
        );

    }
}
// =====================================================
// LẤY AVATAR USER HIỆN TẠI
// =====================================================

async function loadCurrentUserAvatar() {

    const navAvatar =
        document.querySelector("#profile-btn");

    // Avatar mặc định trước
    if (navAvatar) {
        navAvatar.src =
            "https://i.pravatar.cc/100";
    }

    if (!auth.currentUser) {
        currentUserAvatar =
            "https://i.pravatar.cc/60";

        return;
    }

    try {

        const userSnap = await getDocs(
            query(
                collection(db, "users"),
                where(
                    "uid",
                    "==",
                    auth.currentUser.uid
                )
            )
        );

        if (userSnap.empty) {
            return;
        }

        const user =
            userSnap.docs[0].data();

        const avatar =
            user.avatar ||
            "https://i.pravatar.cc/100";

        currentUserAvatar =
            avatar;

        if (navAvatar) {
            navAvatar.src =
                avatar;
        }

        avatarCache[
            auth.currentUser.uid
        ] = avatar;

    }
    catch (err) {

        console.log(
            "Lỗi load avatar:",
            err
        );

    }
}


// =====================================================
// LẤY AVATAR NGƯỜI KHÁC
// =====================================================

async function getUserAvatar(uid) {

    if (!uid) {
        return "https://i.pravatar.cc/60";
    }

    // Đã có trong cache
    if (avatarCache[uid]) {
        return avatarCache[uid];
    }

    const userSnap = await getDocs(
        query(
            collection(db, "users"),
            where("uid", "==", uid)
        )
    );

    if (userSnap.empty) {

        avatarCache[uid] =
            "https://i.pravatar.cc/60";

        return avatarCache[uid];
    }

    const user = userSnap.docs[0].data();

    const userAvatar =
        user.avatar || "https://i.pravatar.cc/60";

    avatarCache[uid] = userAvatar;

    return userAvatar;
}


// =====================================================
// RENDER BÀI VIẾT
// =====================================================

async function renderPost(d) {

    const post = d.data();

    // =================================================
    // LIKE
    // =================================================

    let liked = false;

    if (auth.currentUser) {

        const likeSnap = await getDocs(
            query(
                collection(db, "likes"),
                where("uid", "==", auth.currentUser.uid),
                where("postId", "==", d.id)
            )
        );

        liked = !likeSnap.empty;
    }


    // =================================================
    // AVATAR
    // =================================================

    let postAvatar = "https://i.pravatar.cc/60";

    if (!post.anonymous) {
        postAvatar = await getUserAvatar(post.uid);
    }


    // =================================================
    // USERNAME
    // =================================================

    const displayName = post.anonymous
        ? "👤 Anonymous"
        : (post.username || "Anonymous");


    // =================================================
    // MEDIA
    // =================================================

    let mediaHTML = "";

    if (
        post.mediaType === "image" &&
        post.mediaUrl
    ) {

        mediaHTML = `
            <img
                class="post-image"
                src="${post.mediaUrl}"
                onclick="openImage('${post.mediaUrl}')"
                alt=""
            >
        `;

    } else if (
        post.mediaType === "video" &&
        post.mediaUrl
    ) {

        mediaHTML = `
            <video
                class="post-video"
                controls
                src="${post.mediaUrl}">
            </video>
        `;
    }

    /////////
    async function loadNavAvatar() {

    if (!auth.currentUser) return;

    const userSnap = await getDocs(
        query(
            collection(db, "users"),
            where("uid", "==", auth.currentUser.uid)
        )
    );

    if (userSnap.empty) return;

    const userData = userSnap.docs[0].data();

    const navAvatar = document.getElementById("profile-btn");

    navAvatar.src =
        userData.avatar || "https://i.pravatar.cc/100";
}
    // =================================================
    // HASHTAG
    // =================================================

    let hashtagHTML = "";

    const hashtag = (post.hashtag || "").trim();

    if (hashtag !== "") {

        hashtagHTML = `
            <div class="post-tag">${hashtag}</div>
        `;
    }
    // =================================================
// ADMIN DUYỆT BÀI
// =================================================

let approveHTML = "";

if (
    currentRole === 1 &&
    post.approved === false
) {

    approveHTML = `
        <button
            class="approve-btn"
            onclick="approvePost('${d.id}')"
        >
            <i class="fa-solid fa-check"></i>
            Duyệt
        </button>
    `;
}

    // =================================================
    // OWNER
    // =================================================

    let ownerHTML = "";

    if (
        auth.currentUser &&
        auth.currentUser.uid === post.uid
    ) {

        const safeContent =
            (post.content || "")
                .replace(/`/g, "\\`");

        const safeHashtag =
            (post.hashtag || "")
                .replace(/`/g, "\\`");

        ownerHTML = `
            <div class="owner-btn">

                <button
                    onclick="editPost(
                        '${d.id}',
                        \`${safeContent}\`,
                        \`${safeHashtag}\`
                    )"
                >
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button
                    onclick="deletePost('${d.id}')"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>
        `;
    }


    // =================================================
    // COMMENTS
    // =================================================

    const commentsHTML =
        await loadComments(d.id);


    // =================================================
    // TIME
    // =================================================

    const time = new Date(post.createdAt);

    const timeText =
        time.toLocaleTimeString() +
        " " +
        time.toLocaleDateString();


    // =================================================
    // CONTENT
    // =================================================

    const content =
        (post.content || "").trim();


    // =================================================
    // CARD
    // =================================================

    return `
        <div class="card">

            <div class="top">

                <div class="avatar">
                    <img
                        src="${postAvatar}"
                        alt="avatar"
                    >
                </div>

                <div class="post-user">

                    <h3>${displayName}</h3>

                    <span>${timeText}</span>

                </div>

                ${approveHTML}
                ${ownerHTML}

            </div>


            <div class="post-body">

                <p class="post-content">${content}</p>

                ${mediaHTML}

                ${hashtagHTML}


                <div class="action">

                    <button
                        id="like-${d.id}"
                        class="${liked ? "liked" : ""}"
                        onclick="likePost('${d.id}', ${post.like || 0})"
                    >
                        <i class="fa-${liked ? "solid" : "regular"} fa-heart"></i>
                        <span>${post.like || 0}</span>
                    </button>


                    <button
                        onclick="toggleComment('${d.id}')"
                    >
                        <i class="fa-regular fa-comment"></i>
                        <span>${post.comment || 0}</span>
                    </button>


                    <button
                        onclick="sharePost(\`${content.replace(/`/g, "\\`")}\`)"
                    >
                        <i class="fa-solid fa-share"></i>
                    </button>

                </div>


                <div
                    class="comment-section"
                    id="comment-section-${d.id}"
                    style="display:none;"
                >

                    <div
                        class="comment-list"
                        id="comment-${d.id}"
                    >
                        ${commentsHTML}
                    </div>

                    <div class="comment-input">

                        <input
                            type="text"
                            id="input-${d.id}"
                            placeholder="Viết bình luận..."
                        >

                        <button
                            onclick="sendComment('${d.id}')"
                        >
                            Gửi
                        </button>

                    </div>

                </div>

            </div>

        </div>
    `;
}


// =====================================================
// UPLOAD ẢNH
// =====================================================

async function uploadImage(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        "school-confession"
    );

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/dpn8lp0s7/image/upload",
        {
            method: "POST",
            body: formData
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error.message);
    }

    return data.secure_url;
}


// =====================================================
// UPLOAD VIDEO
// =====================================================

async function uploadVideo(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        "school-confession"
    );

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/dpn8lp0s7/video/upload",
        {
            method: "POST",
            body: formData
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error.message);
    }

    return data.secure_url;
}


// =====================================================
// ĐĂNG BÀI
// =====================================================

async function handlePost(e) {

    e.preventDefault();

    const content =
        inpContent.value.trim();

    const hashtag =
        inpHashtag.value.trim();

    const file =
        inpImage.files[0];


    if (content === "") {

        alert("Vui lòng nhập nội dung");

        return;
    }


    if (!auth.currentUser) {

        alert("Bạn chưa đăng nhập");

        return;
    }


    postBtn.disabled = true;
    postBtn.textContent = "Đang đăng...";


    try {

        // Lấy username
        const userSnap = await getDocs(
            query(
                collection(db, "users"),
                where(
                    "uid",
                    "==",
                    auth.currentUser.uid
                )
            )
        );

        let username = "Anonymous";

        if (!userSnap.empty) {

            username =
                userSnap.docs[0].data().username;
        }


        let mediaUrl = "";
        let mediaType = "";


        // Upload media
        if (file) {

            if (file.type.startsWith("image/")) {

                mediaUrl =
                    await uploadImage(file);

                mediaType = "image";
            }

            else if (file.type.startsWith("video/")) {

                mediaUrl =
                    await uploadVideo(file);

                mediaType = "video";
            }
        }


        const anonymous =
            inpAnonymous.checked;


        // Thêm bài viết
        await addDoc(
    collection(db, "posts"),
    {
        uid: auth.currentUser.uid,
        username,
        anonymous,
        content,
        mediaUrl,
        mediaType,
        hashtag,
        like: 0,
        comment: 0,
        createdAt: Date.now(),

        // Chờ admin duyệt
        approved: currentRole === 1
    }
);   


        alert("Đăng bài thành công");


        // Reset form
        inpContent.value = "";
        inpHashtag.value = "";
        inpImage.value = "";

        preview.src = "";
        preview.style.display = "none";

        videoPreview.src = "";
        videoPreview.style.display = "none";

        inpAnonymous.checked = false;


        postModal.style.display = "none";


        await loadPosts();

    }

    catch (err) {

        console.log(err);

        alert(err.message);

    }

    finally {

        postBtn.disabled = false;
        postBtn.textContent = "Đăng bài";
    }
}

postForm.addEventListener(
    "submit",
    handlePost
);


// =====================================================
// LIKE BÀI VIẾT
// =====================================================

async function likePost(id, like) {

    if (!auth.currentUser) {

        alert("Bạn chưa đăng nhập");

        return;
    }


    const q = query(
        collection(db, "likes"),
        where(
            "uid",
            "==",
            auth.currentUser.uid
        ),
        where(
            "postId",
            "==",
            id
        )
    );


    const snapshot =
        await getDocs(q);


    // Bỏ like
    if (!snapshot.empty) {

        await deleteDoc(
            snapshot.docs[0].ref
        );

        await updateDoc(
            doc(db, "posts", id),
            {
                like: increment(-1)
            }
        );

        await loadPosts();

        return;
    }


    // Like
    await addDoc(
        collection(db, "likes"),
        {
            uid: auth.currentUser.uid,
            postId: id
        }
    );


    await updateDoc(
        doc(db, "posts", id),
        {
            like: like + 1
        }
    );


    const likeBtn =
        document.getElementById(
            "like-" + id
        );

    if (likeBtn) {
        likeBtn.classList.add("liked");
    }


    await loadPosts();
}


// =====================================================
// EDIT BÀI
// =====================================================

function editPost(
    id,
    content,
    hashtag
) {

    editPostId = id;

    editContent.value = content;

    editHashtag.value = hashtag;

    editModal.style.display = "flex";
}

window.editPost = editPost;


saveEdit.addEventListener(
    "click",
    async () => {

        if (
            editContent.value.trim() === ""
        ) {

            alert("Vui lòng nhập nội dung");

            return;
        }


        await updateDoc(
            doc(
                db,
                "posts",
                editPostId
            ),
            {
                content:
                    editContent.value.trim(),

                hashtag:
                    editHashtag.value.trim()
            }
        );


        editModal.style.display = "none";

        editPostId = "";

        await loadPosts();
    }
);


// =====================================================
// XÓA BÀI
// =====================================================

async function deletePost(id) {

    if (
        !confirm(
            "Bạn có chắc muốn xóa bài?"
        )
    ) {
        return;
    }


    // Xóa comment
    const commentSnap =
        await getDocs(
            query(
                collection(
                    db,
                    "comments"
                ),
                where(
                    "postId",
                    "==",
                    id
                )
            )
        );


    for (
        const d of commentSnap.docs
    ) {

        await deleteDoc(d.ref);
    }


    // Xóa like
    const likeSnap =
        await getDocs(
            query(
                collection(db, "likes"),
                where(
                    "postId",
                    "==",
                    id
                )
            )
        );


    for (
        const d of likeSnap.docs
    ) {

        await deleteDoc(d.ref);
    }


    // Xóa bài
    await deleteDoc(
        doc(db, "posts", id)
    );


    await loadPosts();
}

window.deletePost = deletePost;


// =====================================================
// LOAD COMMENT
// =====================================================

async function loadComments(postId) {

    const q = query(
        collection(db, "comments"),
        where("postId", "==", postId)
    );

    const snap = await getDocs(q);

    let html = "";

    for (const d of snap.docs) {

        const c = d.data();

        let avatar = "https://i.pravatar.cc/60";
        let username = c.username || "Người dùng";

        // Có uid thì lấy thông tin đúng người đó
        if (c.uid) {
            try {
                const userAvatar = await getUserAvatar(c.uid);

                if (userAvatar) {
                    avatar = userAvatar;
                }
            }
            catch (err) {
                console.log("Lỗi lấy avatar:", err);
            }
        }

        html += `
    <div class="comment">

        <div class="comment-user">

            <img
                src="${avatar}"
                class="comment-avatar"
            >

            <b>
                ${username}
            </b>

            <span class="comment-content">
                ${c.content || ""}
            </span>

            ${
                auth.currentUser?.uid === c.uid
                    ? `
                        <button
                            class="delete-comment"
                            onclick="deleteComment(
                                '${d.id}',
                                '${postId}'
                            )"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    `
                    : ""
            }

        </div>

    </div>
`;
    }

    return html;
}


// =====================================================
// GỬI COMMENT
// =====================================================

async function sendComment(postId) {

    if (!auth.currentUser) {

        alert("Bạn chưa đăng nhập");

        return;
    }


    const input =
        document.getElementById(
            "input-" + postId
        );


    const text =
        input.value.trim();


    if (text === "") {
        return;
    }


    const userSnap =
        await getDocs(
            query(
                collection(db, "users"),
                where(
                    "uid",
                    "==",
                    auth.currentUser.uid
                )
            )
        );


    let username = "Anonymous";


    if (!userSnap.empty) {

        username =
            userSnap.docs[0].data().username;
    }


    await addDoc(
        collection(db, "comments"),
        {
            postId,
            uid: auth.currentUser.uid,
            username,
            content: text,
            createdAt: Date.now()
        }
    );


    await updateDoc(
        doc(db, "posts", postId),
        {
            comment: increment(1)
        }
    );


    await loadPosts();
}

window.sendComment =
    sendComment;

window.likePost =
    likePost;


// =====================================================
// TOGGLE COMMENT
// =====================================================

function toggleComment(id) {

    const box =
        document.getElementById(
            "comment-section-" + id
        );


    if (!box) {
        return;
    }


    if (
        box.style.display === "none"
    ) {

        box.style.display = "block";

    }

    else {

        box.style.display = "none";
    }
}

window.toggleComment =
    toggleComment;


// =====================================================
// TRENDING
// =====================================================

function loadTrending(posts) {

    const mp = {};


    posts.forEach((d) => {

        const p = d.data();


        if (!p.hashtag) {
            return;
        }


        const tags =
            p.hashtag.split(" ");


        tags.forEach((t) => {

            if (t === "") {
                return;
            }


            mp[t] =
                (mp[t] || 0) + 1;
        });
    });


    const arr =
        Object.entries(mp);


    arr.sort(
        (a, b) => b[1] - a[1]
    );


    trendingList.innerHTML = "";


    arr.slice(0, 5)
        .forEach(
            ([tag, cnt]) => {

                trendingList.innerHTML += `
                    <li
                        onclick="searchTag('${tag}')"
                    >
                        ${tag}

                        <span>
                            ${cnt}
                        </span>
                    </li>
                `;
            }
        );
}


// =====================================================
// XÓA COMMENT
// =====================================================

async function deleteComment(
    commentId,
    postId
) {

    if (
        !confirm("Xóa bình luận?")
    ) {
        return;
    }


    await deleteDoc(
        doc(
            db,
            "comments",
            commentId
        )
    );


    await updateDoc(
        doc(db, "posts", postId),
        {
            comment: increment(-1)
        }
    );


    await loadPosts();
}

window.deleteComment =
    deleteComment;


// =====================================================
// LOAD POSTS
// =====================================================
async function loadPosts() {

    try {

        await loadCurrentUserAvatar();

        postList.innerHTML = "";

        const q = query(
            collection(db, "posts"),
            where("approved", "==", true)
        );

        const snapshot = await getDocs(q);

        // Sắp xếp bài mới nhất trước
        allPosts = snapshot.docs.sort(
            (a, b) =>
                (b.data().createdAt || 0) -
                (a.data().createdAt || 0)
        );

        loadTrending(allPosts);

        for (const d of allPosts) {

            postList.innerHTML +=
                await renderPost(d);
        }

    }

    catch (err) {

        console.log("LỖI LOAD POSTS:", err);

        alert("Không thể tải bài viết");
    }
}


// =====================================================
// LOAD HOT POSTS
// =====================================================

async function loadHotPosts() {

    try {

        await loadCurrentUserAvatar();

        postList.innerHTML = "";


        const q = query(
            collection(db, "posts"),
            orderBy(
                "like",
                "desc"
            )
        );


        const snapshot =
            await getDocs(q);


        for (
            const d of snapshot.docs
        ) {

            postList.innerHTML +=
                await renderPost(d);
        }

    }

    catch (err) {

        console.log(err);

        alert(
            "Không thể tải bài viết"
        );
    }
}


// =====================================================
// LOAD FAVORITE POSTS
// =====================================================

async function loadFavoritePosts() {

    if (!auth.currentUser) {

        alert("Bạn chưa đăng nhập");

        return;
    }


    await loadCurrentUserAvatar();

    postList.innerHTML = "";


    const likeSnap =
        await getDocs(
            query(
                collection(
                    db,
                    "likes"
                ),
                where(
                    "uid",
                    "==",
                    auth.currentUser.uid
                )
            )
        );


    const ids = [];


    likeSnap.forEach((d) => {

        ids.push(
            d.data().postId
        );
    });


    const postSnap = await getDocs(
    query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
    )
);

for (const d of postSnap.docs) {

    const post = d.data();

    if (post.approved !== true) {
        continue;
    }

    if (!ids.includes(d.id)) {
        continue;
    }

    postList.innerHTML +=
        await renderPost(d);
}
}


// =====================================================
// SEARCH BÀI VIẾT
// =====================================================

async function searchPosts() {

    const keyword =
        inpSearch.value
            .trim()
            .toLowerCase();


    postList.innerHTML = "";


    // Ô search trống
    if (keyword === "") {

        await loadPosts();

        return;
    }


    let found = false;


    for (
        const d of allPosts
    ) {

        const post =
            d.data();


        const text =
            (post.content || "")
                .toLowerCase()
            + " "
            + (post.hashtag || "")
                .toLowerCase()
            + " "
            + (post.username || "")
                .toLowerCase();


        if (
            !text.includes(keyword)
        ) {
            continue;
        }


        found = true;


        postList.innerHTML +=
            await renderPost(d);
    }


    // Không tìm thấy
    if (!found) {

        postList.innerHTML = `
            <div class="no-result">

                <i
                    class="fa-solid fa-magnifying-glass"
                ></i>

                <p>
                    Không tìm thấy bài viết phù hợp
                </p>

            </div>
        `;
    }
}


// =====================================================
// SEARCH DELAY 3 GIÂY
// =====================================================

inpSearch.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimeout
        );


        searchTimeout =
            setTimeout(
                async () => {

                    const keyword =
                        inpSearch.value
                            .trim();


                    if (
                        keyword === ""
                    ) {

                        await loadPosts();

                    }

                    else {

                        await searchPosts();
                    }

                },
                3000
            );
    }
);

///////duyet bài cho admin
async function loadPendingPosts() {

    if (currentRole !== 1) {
        alert("Bạn không có quyền!");
        return;
    }

    try {

        postList.innerHTML = `
            <div class="loading-box">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Đang tải bài chờ duyệt...
            </div>
        `;

        // Không dùng orderBy ở đây
        // để tránh lỗi composite index
        const q = query(
            collection(db, "posts"),
            where("approved", "==", false)
        );

        const snapshot = await getDocs(q);

        // Sắp xếp mới nhất trước bằng JS
        const docs = snapshot.docs.sort(
            (a, b) =>
                (b.data().createdAt || 0) -
                (a.data().createdAt || 0)
        );

        if (docs.length === 0) {

            postList.innerHTML = `
                <div class="empty-approve">

                    <i class="fa-solid fa-circle-check"></i>

                    <h2>Không có bài chờ duyệt</h2>

                    <p>
                        Tất cả bài đăng đã được xử lý.
                    </p>

                </div>
            `;

            return;
        }

        postList.innerHTML = `
            <div class="approve-header">

                <div>
                    <h2>
                        <i class="fa-solid fa-shield-halved"></i>
                        Duyệt bài
                    </h2>

                    <p>
                        Các bài đăng đang chờ kiểm duyệt
                    </p>
                </div>

                <span class="pending-count">
                    ${docs.length} bài
                </span>

            </div>
        `;

        for (const d of docs) {

            postList.innerHTML +=
                await renderPendingPost(d);
        }

    }

    catch (err) {

        console.log("LỖI DUYỆT BÀI:", err);

        alert("Không thể tải bài chờ duyệt");
    }
}
// DUYỆT BÀI

approveBtn.addEventListener("click", async (e) => {

    e.preventDefault();

    if (currentRole !== 1) {
        alert("Bạn không có quyền!");
        return;
    }

    await loadPendingPosts();
});
async function renderPendingPost(d) {

    const post = d.data();

    let postAvatar =
        "https://i.pravatar.cc/60";

    if (!post.anonymous) {
        postAvatar =
            await getUserAvatar(post.uid);
    }

    const displayName =
        post.anonymous
            ? "👤 Anonymous"
            : (post.username || "Anonymous");

    let mediaHTML = "";

    if (
        post.mediaType === "image" &&
        post.mediaUrl
    ) {

        mediaHTML = `
            <img
                class="pending-image"
                src="${post.mediaUrl}"
            >
        `;
    }

    else if (
        post.mediaType === "video" &&
        post.mediaUrl
    ) {

        mediaHTML = `
            <video
                class="pending-video"
                controls
                src="${post.mediaUrl}">
            </video>
        `;
    }

    return `
        <div class="pending-card">

            <div class="pending-top">

                <div class="pending-user">

                    <img
                        src="${postAvatar}"
                    >

                    <div>

                        <h3>
                            ${displayName}
                        </h3>

                        <span>
                            ${new Date(
                                post.createdAt
                            ).toLocaleString()}
                        </span>

                    </div>

                </div>

                <span class="pending-label">
                    <i class="fa-solid fa-clock"></i>
                    Chờ duyệt
                </span>

            </div>


            <div class="pending-content">

                <p>
                    ${(post.content || "").trim()}
                </p>

                ${
                    post.hashtag
                        ? `
                            <div class="post-tag">
                                ${post.hashtag}
                            </div>
                          `
                        : ""
                }

                ${mediaHTML}

            </div>


            <div class="pending-actions">

                <button
                    class="reject-btn"
                    onclick="rejectPost('${d.id}')"
                >
                    <i class="fa-solid fa-xmark"></i>
                    Từ chối
                </button>

                <button
                    class="approve-btn"
                    onclick="approvePost('${d.id}')"
                >
                    <i class="fa-solid fa-check"></i>
                    Duyệt bài
                </button>

            </div>

        </div>
    `;
}
async function rejectPost(id) {

    if (currentRole !== 1) {
        alert("Bạn không có quyền!");
        return;
    }

    if (!confirm("Bạn có chắc muốn từ chối bài này?")) {
        return;
    }

    try {

        await deletePost(id);

        await loadPendingPosts();

    }

    catch (err) {

        console.log(err);

        alert("Không thể từ chối bài");
    }
}

window.rejectPost = rejectPost;
// =====================================================
// SEARCH HASHTAG
// =====================================================

function searchTag(tag) {

    inpSearch.value = tag;


    clearTimeout(
        searchTimeout
    );


    searchTimeout =
        setTimeout(
            async () => {

                await searchPosts();

            },
            3000
        );
}

window.searchTag =
    searchTag;


// =====================================================
// HOT
// =====================================================

hotBtn.addEventListener(
    "click",
    (e) => {

        e.preventDefault();

        loadHotPosts();
    }
);
// Favorite

favoriteBtn.addEventListener(
    "click",
    (e) => {

        e.preventDefault();

        loadFavoritePosts();
    }
);


// =====================================================
// OPEN IMAGE
// =====================================================

function openImage(src) {

    imgView.src = src;

    imgModal.style.display =
        "flex";
}

closeImg.onclick = () => {

    imgModal.style.display =
        "none";
};


imgModal.onclick = (e) => {

    if (
        e.target === imgModal
    ) {

        imgModal.style.display =
            "none";
    }
};


window.openImage =
    openImage;


// =====================================================
// SHARE
// =====================================================

async function sharePost(content) {

    try {

        await navigator.clipboard
            .writeText(content);

        alert(
            "Đã sao chép nội dung bài viết!"
        );

    }

    catch {

        alert(
            "Không thể sao chép!"
        );
    }
}

window.sharePost =
    sharePost;


// =====================================================
// PROFILE
// =====================================================
profileBtn.addEventListener(
    "click",
    () => {
        window.location.href =
            "./profile.html";
    }
);
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "./html/login.html";
        return;
    }

    await loadCurrentUserAvatar();

    await loadCurrentUserRole();

    await loadPosts();
});
///////////
async function approvePost(id) {

    if (currentRole !== 1) {
        alert("Bạn không có quyền duyệt bài!");
        return;
    }

    try {

        await updateDoc(
            doc(db, "posts", id),
            {
                approved: true
            }
        );

        alert("Đã duyệt bài!");

        await loadPosts();

    }
    catch (err) {

        console.log(err);

        alert("Không thể duyệt bài!");

    }
}

window.approvePost = approvePost;
// =====================================================
// LOGOUT
// =====================================================
logoutBtn.addEventListener(
    "click",
    async (e) => {

        e.preventDefault();
        if (
            !confirm(
                "Bạn muốn đăng xuất?"
            )
        ) {
            return;
        }

        await signOut(auth);
        localStorage.removeItem(
            "user_session"
        );

        window.location.href =
            "./login.html";
    }
);
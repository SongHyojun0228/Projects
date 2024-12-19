const express = require("express");
const multer = require("multer");
const path = require("path"); 
const db = require("../data/database");
const { ObjectId } = require("mongodb");
const router = express.Router();

const storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

function timeAgo(time) {
  const now = new Date();
  const diff = Math.floor((now - time) / 1000);

  if (diff < 60) {
    return `${diff}초 전`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes}분 전`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}시간 전`;
  } else {
    const days = Math.floor(diff / 86400);
    return `${days}일 전`;
  }
}

router.get("/community", async function (req, res) {
  try {
    const posts = await db
      .getDb()
      .collection("Post")
      .find()
      .sort({ time: -1 }) 
      .toArray();

    const users = await db.getDb().collection("User").find().toArray();

    posts.forEach((post) => {
      if (post.content.length > 30) {
        post.shortContent = post.content.substring(0, 30) + "...";
      } else {
        post.shortContent = post.content;
      }
      post.timeAgo = timeAgo(post.time);
    });

    res.render("community", { posts: posts, users: users });
  } catch (error) {
    console.error("게시물 로드 중 오류:", error);
    res.status(500).render("500");
  }
});


router.get("/community/:id", async function (req, res) {
  const PostId = req.params.id;

  if (!ObjectId.isValid(PostId)) {
    return res.render("404");
  }

  try {
    const post = await db
      .getDb()
      .collection("Post")
      .findOne({ _id: new ObjectId(PostId) });

    if (!post) {
      return res
        .status(404)
        .render("404", { message: "게시물을 찾을 수 없습니다." });
    }

    const comments = await db
      .getDb()
      .collection("Comment")
      .find({ postId: new ObjectId(PostId) })
      .toArray();

    post.timeAgo = timeAgo(post.time);
    comments.forEach((comment) => {
      comment.timeAgo = timeAgo(comment.time);
    });

    res.render("community-detail", {
      post: post,
      comments: comments,
      error: {},
    });
  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).render("500");
  }
});

router.post("/comment", async function (req, res) {
  const postId = req.body.postId;
  const comment = req.body.comment;

  const post = await db
    .getDb()
    .collection("Post")
    .findOne({ _id: new ObjectId(postId) });

  const comments = await db
    .getDb()
    .collection("Comment")
    .find({ postId: new ObjectId(postId) })
    .toArray();

  if (!post) {
    return res.status(404).render("404");
  }

  post.timeAgo = timeAgo(post.time);
  comments.forEach((comment) => {
    comment.timeAgo = timeAgo(comment.time);
  });

  if (!req.session.user) {
    console.log("로그인하지 않은 사용자가 댓글을 시도했습니다.");
    return res.render("community-detail", {
      post: post,
      comments: comments,
      error: { message: "댓글을 작성하려면 로그인이 필요합니다." },
    });
  }

  const user = req.session.user;

  if (!postId || !comment) {
    return res.status(404).render("404");
  }

  const newComment = {
    postId: new ObjectId(postId),
    comment: comment,
    author: user.username,
    user_id: user.id,
    time: new Date(),
  };

  try {
    const result = await db.getDb().collection("Comment").insertOne(newComment);
    console.log("댓글 삽입 성공:", newComment);
    res.redirect(`/community/${postId}`);
  } catch (error) {
    console.error("댓글 추가 중 오류:", error);
    res.status(500).render("500");
  }
});

router.get("/insert-post", function (req, res) {
  res.render("insert-post");
});

router.post("/insert-post", upload.fields([
    { name: "img1", maxCount: 1 },
    { name: "img2", maxCount: 1 },
    { name: "img3", maxCount: 1 },
    { name: "img4", maxCount: 1 },
    { name: "img5", maxCount: 1 },
  ]), async function (req, res) {
    if (!req.session.user) {
      return res.redirect("/login");
    }
  
    const imgPaths = [];
    ["img1", "img2", "img3", "img4", "img5"].forEach((key) => {
      if (req.files[key]) {
        imgPaths.push(`/uploads/${req.files[key][0].filename}`);
      }
    });
  
    const post = {
      title: req.body.title,
      img: imgPaths, 
      content: req.body.content,
      author: req.session.user.username,
      time: new Date(),
      user_id: req.session.user.id,
    };
  
    try {
      await db.getDb().collection("Post").insertOne(post);
      console.log("게시물 삽입 성공:", post);
      res.redirect("/community");
    } catch (error) {
      console.error("게시물 등록 중 오류:", error);
      res.status(500).render("500");
    }
  });
  

module.exports = router;
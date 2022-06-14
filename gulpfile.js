"use strict";

const gulp = require("gulp");

const minify = require("gulp-minify");

const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");

const nunjucksRender = require("gulp-nunjucks-render");

const rename = require("gulp-rename");

const plumber = require("gulp-plumber");
const server = require("browser-sync").create();
const ftp = require("vinyl-ftp");
const replace = require("gulp-replace");
const filter = require("gulp-filter");

const del = require("del");
const fs = require("fs");

const newer = require("gulp-newer");

const concat = require("gulp-concat");
const remember = require("gulp-remember");

const debug = require("gulp-debug");

let config = null;

const site = "petabox.dev";
const domain = "petabox.htmlpluscss.website";

try {
  config = require("./config.json");

  config.ftp.remotePath = domain + config.ftp.remotePath;
} catch (e) {
  console.log("config the file doesn't exists");
}

const html = (files, since = {}, folder = "") => {
  return (
    gulp
      .src(files, since)
      .pipe(plumber())
      .pipe(debug({ title: "html:" }))
      .pipe(
        nunjucksRender({
          data: {
            url: "https://" + domain,
            site: site,
          },
          path: "src/",
        })
      )
      //		.pipe(w3cjs())
      //		.pipe(w3cjs.reporter())
      .pipe(gulp.dest("build" + folder))
  );
};

gulp.task("html", () =>
  html("src/**/index.html", { since: gulp.lastRun("html") })
);
gulp.task("html:touch", () => html("src/**/index.html"));
gulp.task("html:main", () => html("src/index.html", {}, "/"));

gulp.task("sass", () => {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(sass())
    .pipe(rename("styles.css"))
    .pipe(gulp.dest("./build/css"));
});

gulp.task("js", () => {
  return (
    gulp
      .src(
        [
          "src/js/*.min.js",
          "src/js/js.js",
          "src/js/*.js",
          //		'!src/js/inputmask.min.js',
        ],
        { since: gulp.lastRun("js") }
      )

      .pipe(debug({ title: "js" }))
      .pipe(sourcemaps.init())
      .pipe(remember("js"))
      .pipe(concat("scripts.js"))
      .pipe(sourcemaps.write())

      // prod

      .pipe(
        minify({
          preserveComments: "some",
          ext: {
            min: ".min.js",
          },
        })
      )

      .pipe(gulp.dest("build/js"))
  );
});

gulp.task("serve", () => {
  //	gulp.src([
  //		'src/js/inputmask.min.js',
  //	]).pipe(gulp.dest('build/js'));

  server.init({
    server: "build",
    files: [
      {
        match: ["build/**/*.*", "!build/**/*.min.{css,js}"],
        fn: server.reload(),
      },
    ],
  });
});

gulp.task("clear", () => del("build"));

gulp.task("copy", () => {
  return gulp
    .src(["src/**/*.*", "!src/**/*.{css,html,js}"], {
      since: gulp.lastRun("copy"),
    })
    .pipe(debug({ title: "copy:" }))
    .pipe(newer("build"))
    .pipe(debug({ title: "copy:newer" }))
    .pipe(gulp.dest("build"));
});

gulp.task("ftp", () => {
  if (!config) {
    return true;
  }

  const f = filter("**/*.html", { restore: true });
  const conn = ftp.create(config.ftp);

  return gulp
    .src(["build/**/*"], { since: gulp.lastRun("ftp") })
    .pipe(debug({ title: "ftp:" }))
    .pipe(f)
    .pipe(replace("css/styles.css", "css/styles.min.css?" + Date.now()))
    .pipe(replace("js/scripts.js", "js/scripts.min.js?" + Date.now()))
    .pipe(f.restore)
    .pipe(conn.dest(domain));
});

gulp.task("watch", () => {
  gulp.watch("src/js/*.*", gulp.series("js"));
  gulp.watch("src/scss/*.*", gulp.series("sass"));
  gulp.watch("src/**/index.html", gulp.series("html"));
  gulp.watch(["src/main/**", "!src/main/index.html"], gulp.series("html:main"));
  gulp.watch(
    ["src/_include/**/*.html", "src/template/**/*.html"],
    gulp.series("html:touch")
  );
  gulp.watch(["src/**/*.*", "!src/**/*.{css,html,js}"], gulp.series("copy"));
  gulp.watch("build/**/*.*", gulp.series("ftp"));
});

gulp.task(
  "default",
  gulp.series(
    "clear",
    gulp.parallel("sass", "js"),
    "html",
    "copy",
    gulp.parallel("ftp", "watch", "serve")
  )
);

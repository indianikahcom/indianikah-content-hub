const { getProductionPool } = require("../database/productionMysql");

async function findAllBooks() {
    const [rows] = await getProductionPool().query(`
        SELECT id, title, author, pdf, cover, language, download_count
        FROM book_book
        ORDER BY id DESC
    `);
    return rows;
}

async function findAllGuidelines() {
    const [rows] = await getProductionPool().query(`
        SELECT id, \`order\`, title, title_hindi, youtube_code
        FROM configs_guideline
        ORDER BY \`order\` ASC, id DESC
    `);
    return rows;
}

async function findAllBlogs() {
    const [rows] = await getProductionPool().query(`
        SELECT id, title, link, created_on, preview
        FROM configs_blog
        ORDER BY created_on DESC, id DESC
    `);
    return rows;
}

module.exports = { findAllBooks, findAllGuidelines, findAllBlogs };

"use strict";
const sqlite3 = require('sqlite3').verbose();
class Db {
  constructor(file) {
    this.db = new sqlite3.Database(file);
    this.createTableUser();
    this.createTableTracks();
  }
  createTableUser() {
    const sql = `
      CREATE TABLE IF NOT EXISTS user (
        id integer PRIMARY KEY, 
        name text, 
        email text UNIQUE, 
        user_pass text)`
    return this.db.run(sql);
  }
  createTableTracks() {
    const sql = `
      CREATE TABLE IF NOT EXISTS tracks (
        id integer PRIMARY KEY, 
        author text, 
        name text, 
        genre text,
        src text UNIQUE,
        user_id integer)`
    return this.db.run(sql);
  }
  selectByEmail(email, callback) {
    return this.db.get(
      `SELECT * FROM user WHERE email = ?`,
      [email],function(err,row){
          callback(err,row)
      })
  }
  selectById(id, callback) {
    return this.db.get(
      `SELECT * FROM user WHERE id = ?`,
      [id],function(err,row){
          callback(err,row)
      })
  }

  selectAllTrack(callback) {
    return this.db.all(
      `SELECT * FROM tracks`, function(err,rows){
          callback(err,rows)
      })
  }

  selectAll(callback) {
    return this.db.all(`SELECT * FROM user`, function(err,rows){
      callback(err,rows)
    })
  }
  insertUser(user, callback) {
    return this.db.run(
      'INSERT INTO user (name,email,user_pass) VALUES (?,?,?)',
      user, (err) => {
          callback(err)
      })
  }
  insertTrack(track, callback) {
    return this.db.run(
      'INSERT INTO tracks (author, name, genre, src, user_id) VALUES (?,?,?,?,?)',
      track, (err) => {
          callback(err)
      })
  }
  removeTrack(src, callback) {
    return this.db.run(
      'DELETE FROM tracks WHERE src = ?',
      src, (err) => {
          callback(err)
      })
  }
}
module.exports = Db
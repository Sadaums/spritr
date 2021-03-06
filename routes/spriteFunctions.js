const knex = require('../knex');

let addTagsToSprite = (spriteId) => {
  return knex('sprites_tags')
    .select('tags.name as tagname')
    .join('tags', 'tags.id', 'sprites_tags.tag_id')
    .where('sprites_tags.sprite_id', spriteId)
}

let addCommentsToSprite = (spriteId) => {
  return knex('comments')
    .where('comments.sprite_id', spriteId)
    .where('comments.archived_comment', false)
    .select('users.username as author', 'comments.created_at as created_at', 'comments.edited as edited', 'comments.content as content', 'comments.id as comment_id')
    .leftOuterJoin('users', 'users.id', 'comments.author_id')
}

let addLikesToSprite = (spriteId) => {
  return knex('likes')
    .where('likes.sprite_id', spriteId)
    .where('likes.isLiked', true)
    .count('likes.sprite_id')
}


let getSprite = (spriteId) => {
  return knex('sprites')
    .select('sprites.id as id', 'sprites.name as name', 'sprites.render_url as render_url', 'users.id as user_id', 'users.username as username')
    .leftOuterJoin('users', 'sprites.user_id', 'users.id')
    .where('sprites.id', spriteId)
    .first();
}

let getSpriteWithUserCommentsLikes = (spriteId) => {
  return Promise.all([
    getSprite(spriteId),
    addCommentsToSprite(spriteId),
    addLikesToSprite(spriteId),
    addTagsToSprite(spriteId)
  ]).then((results) => {
    let [sprite, comments, likes, tags] = results;
    sprite.comments = comments;
    sprite.likes = likes[0].count;
    sprite.tags = tags;
    return sprite;
  })
}

let getOneSprite = (spriteId) => {
  return knex('sprites')
    .where('sprites.id', spriteId)
    .first()
    .then((spriteFromKnex) => {
      return getSpriteWithUserCommentsLikes(spriteFromKnex.id)
    })
}

let getSpritesByUser = (userId) => {
  return knex('sprites')
    .select('id')
    .where('user_id', userId)
    .then((spriteIds) => {
      return Promise.all(spriteIds.map(el => getSpriteWithUserCommentsLikes(el.id)))
    })
}

let getAllSprites = () => {
  return knex('sprites')
    .select('id')
    .then((spriteIds) => {
      return Promise.all(spriteIds.map(el => getSpriteWithUserCommentsLikes(el.id)))
    })
}

module.exports.getSpritesByUser = getSpritesByUser;
module.exports.getAllSprites = getAllSprites;
module.exports.getOneSprite = getOneSprite;

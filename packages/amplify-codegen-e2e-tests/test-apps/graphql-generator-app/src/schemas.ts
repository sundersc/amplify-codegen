export const modelSchema = `
  type Blog @model {
    id: ID!
    name: String!
    posts: [Post] @hasMany
  }
  
  type Post @model {
    id: ID!
    title: String!
    blog: Blog @belongsTo
    comments: [Comment] @hasMany
  }
  
  type Comment @model {
    id: ID!
    post: Post @belongsTo
    content: String!
  }
`;

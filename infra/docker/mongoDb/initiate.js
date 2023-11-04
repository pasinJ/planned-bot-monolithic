print("Start initial entrypoint");

if (process.env.BACKEND_USER && process.env.BACKEND_PASSWORD) {
  const res = db.createUser({
    user: process.env.BACKEND_USER,
    pwd: process.env.BACKEND_PASSWORD,
    roles: [{ role: "readWrite", db: "backend" }],
  });
  print("Create new user", res);
} else {
  print("No user to create");
}

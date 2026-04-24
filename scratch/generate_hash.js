import bcrypt from 'bcryptjs';

const password = '123abc';
const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);



/*
INSERT INTO users (id, email, password, role) 
VALUES (
  'cb7a2016-7c72-41e9-9af7-bf8cd7c9b193', 
  'hiranmayroy@proton.me', 
  '$2b$10$A0h6Q/lOoQDlbfjk.CPq7.JtDUrCE/5xA20bb12puK0s44685U4D2', 
  'admin'
);

*/
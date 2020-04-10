let DATA = require("../../utils/DATA");
let helpers = require("../../utils/helpers");

module.exports = async (req, res, database) => {
  let code = req.query.code;
  let role_id = req.query.role_id;
  let role_type = "";
  let errFlag = false;

  let isUserExist = async (_) => {
    try {
      const res = await database(`SELECT code FROM ${role_type} WHERE code=?`, [
        code,
      ]);
      if (res.length >= 1) {
        return true;
      } else return false;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let deleteUser = async (_) => {
    try {
      const res = await database(`DELETE FROM ${role_type} WHERE code=?`, [
        code,
      ]);
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let getAllUsers = async (_) => {
    try {
      const res = await database(`SELECT * FROM ${role_type}`);
      return res;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  ///////////////////////////////////////////////////////////////////

  // check for valid incoming varaibles
  if (!role_id) {
    res.status(400).send({
      message: `${!role_id ? "role_id" : ""} is missing`,
    });
    return;
  }

  role_type = helpers.setType(role_id);
  if (!(await isUserExist())) {
    res.status(400).send({
      message: `user not found`,
    });
    return;
  }

  await deleteUser();
  const newData = await getAllUsers();
  if (errFlag) {
    res.status(500).send({ msg: `internal server error` });
    return;
  }
  res.status(200).send(newData);
};
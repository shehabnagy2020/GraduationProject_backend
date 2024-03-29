let CDN = require("../../utils/CDN");

module.exports = async (req, res, database) => {
  let id = req.body.id;
  let content = req.body.content;
  let deadline = req.body.deadline;
  let total_mark = req.body.total_mark;
  let course_code = req.body.course_code;
  let errFlag = false;
  let role_type = res.locals.role_type;
  let role_id = res.locals.role_id;
  let user = res.locals.user;
  let assignmentInfo;

  let isExist = async (_) => {
    try {
      const res = await database(
        "SELECT * FROM assignment WHERE id=? LIMIt 1",
        [id]
      );
      if (res.length >= 1) {
        assignmentInfo = res[0];
        return true;
      } else return false;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let isSolved = async (_) => {
    try {
      const res = await database(
        "SELECT * FROM student_assignment WHERE assignment_id=? LIMIt 1",
        [id]
      );
      if (res.length >= 1) return true;
      else return false;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let isCourseExist = async (_) => {
    try {
      const res = await database("SELECT * FROM course WHERE code=? LIMIt 1", [
        course_code,
      ]);
      if (res.length >= 1) return true;
      else return false;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let insertUpdate = async (_) => {
    try {
      const res = await database(
        `UPDATE assignment SET content=?, total_mark=?, deadline=?, course_code=? WHERE id=?`,
        [
          content,
          total_mark,
          require("moment")(new Date(deadline)).format("YYYY-MM-DD HH:mm:ss"),
          course_code,
          id,
        ]
      );
      console.log(req.files);
      if (req.files && req.files.length >= 1) {
        await deleteOld();
        for (let i = 0; i < req.files.length; i++) {
          const element = req.files[i];
          await insertNewHelper(element, id);
        }
      }
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let deleteOld = async (_) => {
    try {
      const selRes = await database(
        `SELECT * FROM assignment_data WHERE assignment_id=?`,
        [id]
      );
      if (selRes.length >= 1) {
        const delRes = await database(
          `DELETE FROM assignment_data WHERE assignment_id=?`,
          [id]
        );
        for (let i = 0; i < selRes.length; i++) {
          const element = selRes[i].data;
          await CDN.remove(element);
        }
      }
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let insertNewHelper = async (data, assignment_id) => {
    try {
      const path = data.path.replace(/\\/g, "/");

      const res = await database(
        `INSERT INTO assignment_data (data, name, assignment_id) VALUE (?,?,?)`,
        [path, data.originalname, assignment_id]
      );
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  /////////////////////////////////////////////////////////////////////////////////

  if (!id || !content || !deadline || !total_mark || !course_code) {
    res.status(400).send({
      message: `${
        !id
          ? "id"
          : !content
          ? "content"
          : !deadline
          ? "deadline"
          : !total_mark
          ? "total_mark"
          : !course_code
          ? "course_code"
          : ""
      } is missing`,
    });
    return;
  }

  if (!(await isExist())) {
    res.status(400).send({ message: `assignment not exist` });
    return;
  }

  if (await isSolved()) {
    res.status(400).send({
      message: `assignment cannot be edited, becouze it has been solved by one or more students`,
    });
    return;
  }

  if (!(await isCourseExist())) {
    res.status(400).send({ message: `course not exist` });
    return;
  }

  await insertUpdate();

  if (errFlag) {
    res.status(500).send({ message: `internal server error` });
    return;
  }
  res.status(200).send({ message: "assignment edited successfully" });
};

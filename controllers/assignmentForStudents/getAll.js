module.exports = async (req, res, database) => {
  let avialability_type = req.query.avialability_type;
  let errFlag = false;
  let role_type = res.locals.role_type;
  let user = res.locals.user;
  let page = req.query.page;
  let limit = 5;

  let getAllAvailable = async (_) => {
    try {
      page = page && page >= 1 ? page : 1;
      let offset = (page - 1) * limit;
      const selectRes = await database(
        `SELECT * FROM assignment WHERE course_code IN (SELECT code FROM course WHERE grade_year_id=? AND department_id=?) AND assignment.id NOT IN (SELECT assignment_id FROM student_assignment WHERE student_code=?) AND DATE(assignment.deadline) > NOW() ORDER BY assignment.date DESC LIMIT ? OFFSET ?`,
        [user.grade_year_id, user.department_id, user.code, limit, offset]
      );
      for (let i = 0; i < selectRes.length; i++) {
        const element = selectRes[i];

        selectRes[i].course = await getAllHelper(element.course_code);
        selectRes[i].files = await getAllHelper2(element.id, user.code);
        delete selectRes[i].course_code;
      }
      return selectRes;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let getAllDelivered = async (_) => {
    try {
      page = page && page >= 1 ? page : 1;
      let offset = (page - 1) * limit;
      const selectRes = await database(
        `SELECT * FROM assignment WHERE course_code IN (SELECT code FROM course WHERE grade_year_id=? AND department_id=?) AND assignment.id IN (SELECT assignment_id FROM student_assignment WHERE student_code=?) AND DATE(assignment.deadline) > NOW() ORDER BY assignment.date DESC LIMIT ? OFFSET ?`,
        [user.grade_year_id, user.department_id, user.code, limit, offset]
      );
      for (let i = 0; i < selectRes.length; i++) {
        const element = selectRes[i];

        selectRes[i].course = await getAllHelper(element.course_code);
        selectRes[i].files = await getAllHelper2(element.id, user.code);
        delete selectRes[i].course_code;
      }
      return selectRes;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let getAllHelper = async (code) => {
    try {
      const res = await database(`SELECT name, code FROM course WHERE code=?`, [
        code,
      ]);
      return res[0];
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  let getAllHelper2 = async (assignment_id, student_code) => {
    try {
      const selectRes = await database(
        `SELECT data, name FROM student_assignment_data WHERE assignment_id=? AND student_code=?`,
        [assignment_id, student_code]
      );
      return selectRes;
    } catch (error) {
      console.log(error);
      errFlag = true;
    }
  };

  //////////////////////////////////////////////

  if (!page || !avialability_type) {
    res.status(400).send({
      message: `${
        !page ? "page" : !avialability_type ? "avialability_type" : ""
      } is missing`,
    });
    return;
  }
  let data;
  if (avialability_type == 0) data = await getAllAvailable();
  else data = await getAllDelivered();
  if (errFlag) {
    res.status(500).send({ message: `internal server error` });
    return;
  }
  res.status(200).send(data);
};

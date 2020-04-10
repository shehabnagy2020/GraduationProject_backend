module.exports = async (req, res, database) => {
  let errFlag = false;

  let getAll = async _ => {
    try {
      const res = await database('SELECT * FROM department');
      return res;
    } catch (error) {
      console.log(error);
      errFlag = true
    }
  };

  //////////////////////////////////////////////////////////////////

  let data = await getAll();
  if (errFlag) {
    res.status(500).send({ msg: `internal server error` });
    return
  }
  res.status(200).send(data);
};
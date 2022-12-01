const fs = require('fs');
const { resolve } = require('path');
const path = require('path');
const { Sequelize, Op, DataTypes, Model } = require('sequelize');

// postgres://rvrwdrat:u5rI3JhMXwD2RYFCnrudqFUPCLIB7sy7@peanut.db.elephantsql.com/rvrwdrat

var sequelize = new Sequelize('rvrwdrat', 'rvrwdrat', 'u5rI3JhMXwD2RYFCnrudqFUPCLIB7sy7', {
  host: 'peanut.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
   query: { raw: true }
});

class Student extends Model {}


Student.init({
  studentID:{
    type:DataTypes.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  firstName:{
    type:DataTypes.STRING
  },
  lastName:{
    type:DataTypes.STRING
  },
  email:{
    type:DataTypes.STRING
  },
  phone:{
    type:DataTypes.STRING
  },
  addressStreet:{
    type:DataTypes.STRING
  },
  addressCity:{
    type:DataTypes.STRING
  },
  addressState:{
    type:DataTypes.STRING
  },
  addressPostal:{
    type:DataTypes.STRING
  },
  isInternationalStudent:{
    type:DataTypes.BOOLEAN
  },
  expectedCredential:{
    type:DataTypes.STRING
  },
  status:{
    type:DataTypes.STRING
  },
  registrationDate:{
    type:DataTypes.STRING
  },
  program:{
    type:DataTypes.STRING
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'Student' // We need to choose the model name
});

class Program extends Model {}


Program.init({
  programCode:{
    type:DataTypes.STRING,
    primaryKey:true
  },
  programName:{
    type:DataTypes.STRING
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'Program' // We need to choose the model name
});

Program.hasMany(Student, {foreignKey: 'program'});




const initialize = () => {
  return new Promise((resolve, reject) => {
     sequelize.sync()
    .then(function() {
        resolve();
    }).catch((err)=>{
        reject("unable to sync the database");
    });
  });
};


const getAllStudents = () => {
  return new Promise((resolve, reject) => {
    Student.findAll().then((students)=>{
      if(students.length > 0){
          resolve(students);
      }else{
         reject("No students found!")
      }
    }).catch(()=>{
      reject("no results returned");
    })
    
  });
};

const getInternationalStudents = () => {
  return new Promise((resolve, reject) => {
    Student.findAll({
      where:{
        isInternationalStudent:{
          [Op.eq]:true
        }
      }
    }).then((students)=>{
      if(students.length > 0){
          resolve(students);
      }else{
         reject("No students found!")
      }
    }).catch(()=>{
      reject("no results returned");
    })
  });
};

const getPrograms = () => {
  return new Promise((resolve, reject) => {

    Program.findAll().then((Programs)=>{
      if(Programs.length > 0){
          resolve(Programs);
      }else{
         reject("No program found!")
      }
    }).catch(()=>{
      reject("no program returned");
    })
  });
};

const getStudentsByStatus = (status) => {
  return new Promise((resolve, reject) => {
    Student.findAll({
      where:{
        status:{
          [Op.eq]:status
        }
      }
    }).then((students)=>{
        if(students.length == 0){
          reject(`No results found ${status}`);
        }
        resolve(students);
    }).catch(()=>{
      reject("no student returned");
    })
  })
}

const getStudentsByProgramCode = (programCode) => {
  return new Promise((resolve, reject) => {
    Student.findAll({
      where:{
        program:{
          [Op.eq]:programCode
        }
      }
    }).then((students)=>{
      if(students.length == 0){
        reject(`No results found ${programCode}`);
      }
      resolve(students);
    }).catch((err)=>{
      reject("no student returned");
    })

  })
}

const getStudentsByExpectedCredential = (credential) => {
  return new Promise((resolve, reject) => {
    Student.findAll({
      where:{
        expectedCredential:{
          [Op.eq]:credential
        }
      }
    }).then((students)=>{
      if(students.length == 0){
        reject(`No results found ${programCode}`);
      }
      resolve(students);
    }).catch((err)=>{
      reject("no student returned");
    })

  })
}

const getStudentById = (sid) => {
  return new Promise((resolve, reject) => {
    Student.findOne({
      where:{
        studentID:{
          [Op.eq]:sid
        }
      }
    }).then((students)=>{
      if(students.length == 0){
        reject(`No results found ${sid}`);
      }
      resolve(students);
    }).catch((err)=>{
      reject("no student returned");
    })
  })
}

const addStudent = (StudentData) => {

  for(let props in StudentData){
    if(StudentData[props] == ''){
     StudentData[props] = null;
    }
  }

  return new Promise((resolve, reject) => {
      Student.create({
        firstName: StudentData.firstName,
        lastName: StudentData.lastName,
        email: StudentData.email,
        phone: StudentData.phone,
        addressStreet: StudentData.addressStreet,
        addressCity: StudentData.addressCity,
        addressState: StudentData.addressState,
        addressPostal: StudentData.addressPostal,
        gender: StudentData.gender,
        isInternationalStudent:  StudentData.isInternationalStudent ? true : false,
        expectedCredential: StudentData.expectedCredential,
        status: StudentData.status,
        program: StudentData.program,
        registrationDate: StudentData.registrationDate
    }).then(()=>{
      resolve();
    }).catch(()=>{
        reject("unable to create student")
    })
  })
}


const updateStudent = (studentData) => {
  for(let props in studentData){
    if(studentData[props] == ''){
     studentData[props] = null;
    }
  }
  return new Promise((resolve, reject) => {
      const id = studentData.studentID;
      Student.update({
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
        phone: studentData.phone,
        addressStreet: studentData.addressStreet,
        addressCity: studentData.addressCity,
        addressState: studentData.addressState,
        addressPostal: studentData.addressPostal,
        gender: studentData.gender,
        isInternationalStudent:  studentData.isInternationalStudent ? true : false,
        expectedCredential: studentData.expectedCredential,
        status: studentData.status,
        program: studentData.program,
        registrationDate: studentData.registrationDate
      },
      {
        where:{
          studentID:{
            [Op.eq]:id.trim()
          }
        }
      }).then(()=>{
          resolve();
      }).catch(()=>{
          reject("unable to update student");
      })
  })
}

const addProgram = (programData) =>{
  for(let props in programData){
    if(programData[props] == ''){
     programData[props] = null;
    }
}
  return new Promise((resolve, reject)=>{
    Program.create({
      programCode:programData.programCode,
      programName:programData.programName
    }).then(()=>{
      resolve();
    }).catch((res)=>{
        reject('unable to create program');
    })
  });
}

const updateProgram = (programData) =>{

  for(let props in programData){
       if(programData[props] == ''){
        programData[props] = null;
       }
  }

  return new Promise((resolve, reject)=>{
    Program.update({
      programCode:programData.programCode,
      programName:programData.programName
    }, {
      where:{
        programCode:{
          [Op.eq]:programData.programCode
        }
      }
    }).then(()=>{
      resolve();
    }).catch((res)=>{
        reject('unable to update program');
    })
  });
}


const getProgramByCode = (pcode) =>{
  return new Promise((resolve, reject)=>{
    Program.findOne({
      where:{
        programCode:{
          [Op.eq]:pcode
        }
      }
    }).then((program)=>{
        resolve(program);
    }).catch(()=>{
        reject("no results returned");
    })
  });
}

const deleteProgramByCode = (pcode) =>{
  return new Promise((resolve, reject)=>{
     Program.destroy({
       where:{
         programCode:{
          [Op.eq]:pcode
         }
       }
     }).then(()=>{
      resolve();
     }).catch(()=>{
        reject("Unable to delete program");
     })
  });
}

const deleteStudenById = (id) =>{
  return new Promise((resolve, reject)=>{
     Student.destroy({
       where:{
         studentID:{
          [Op.eq]:id
         }
       }
     }).then(()=>{
      resolve();
     }).catch(()=>{
        reject("Unable to delete program");
     })
  });
}


module.exports = {
  initialize,
  getAllStudents,
  getInternationalStudents,
  getPrograms,
  getStudentsByStatus,
  getStudentById,
  getStudentsByExpectedCredential,
  getStudentsByProgramCode,
  addStudent,
  updateStudent,
  deleteStudenById,
  deleteProgramByCode,
  getProgramByCode,
  updateProgram,
  addProgram
};

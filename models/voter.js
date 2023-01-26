'use strict';
const bcrypt = require("bcrypt");
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
    }
    static async getVoters(id) {
      return await Voter.findAll({
        where: {
          electionId: id,
        },
      });
    }
    
    static async createVoter({ id , password ,electionId}) {
      try {
        return await this.create({ email : id, password: password ,voteStatus: false ,electionId: electionId});
      } catch (error) {
        console.log(error);
        
      }
    }

    static deleteVoter(id) {
      // console.log("11111111122223")
      try {
        this.destroy({
          where:{id}
        });
      } catch (error) {
        console.log(error);
        
      }
    }
     
    static async changeVoteStatus(id){
      try {
        await this.update({
          voteStatus : true
        },{
          where:{id}
        });
      } catch (error) {
        console.log(error);
        
      }
    }

    static async voteCount(id){
      return await Voter.findAll({
        where: {
          electionId: id,
          voteStatus: true
        },
      });
    }

    static async resetVoterStatus(id){
      return await Voter.update({
        voteStatus:false,
    },{
      where:{
        electionId:id
      }
    })
    }
  }

  Voter.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "Proper email required!",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        async checkpwd(pwd) {
          if (await bcrypt.compare("", pwd)) {
            throw new Error("Invalid password");
          }
        },
      },
    },
    voteStatus: DataTypes.BOOLEAN,
    electionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Voter',
  });
  return Voter;
};
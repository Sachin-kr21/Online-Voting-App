'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {

    static associate(models) {

      Election.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });

      Election.hasMany(models.Question, {
        foreignKey: "electionId",
      });
    }

    static async createElection({ name , adminId}) {
      try {
        return await this.create({ name: name, electionStatus: false ,adminId : adminId});
      } catch (error) {
        console.log(error);
      }
    }

    static deleteElection(id) {
      this.destroy({
        where:{id,
        
        }
      });
    }

    static getElections(adminId) {
      // console.log("8888888888888888",adminId)
      return this.findAll(
        {where:{
          adminId
        }}
      );
    }
    static async startElection(id) {
      return await this.update({ electionStatus: true },{where:{id:id}});
    }
    static async endElection(id) {
      return await this.update({ electionStatus: false },{where:{id:id}});
    }
  }
  Election.init({
    name: DataTypes.STRING,
    electionStatus: DataTypes.BOOLEAN,
    
  }, {
    sequelize,
    modelName: 'Election',
  });
  return Election;
};

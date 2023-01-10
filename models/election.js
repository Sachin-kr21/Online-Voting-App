'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Election.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });
    }
    // static addElection({title,adminId}) {
    //   return this.create({
    //     name: title,
    //     adminId : adminId
    //   });
    // }
    static async createElection({ name , adminId}) {
      try {
        return await this.create({ name: name, electionStatus: false ,adminId : adminId});
      } catch (error) {
        console.log(error);
      }
    }

    // static addE({ name1 }) {
    //   return this.create({
    //     name : name1
    //   });
    // }
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
    async startAnElection() {
      return await this.update({ onGoingStatus: true });
    }
  }
  Election.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Election',
  });
  return Election;
};

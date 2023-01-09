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
    }
    static addElection({title}) {
      return this.create({
        name: title
        
      });
    }
    static async createElection({ name }) {
      try {
        return await this.create({ name: name, electionStatus: false });
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
        where:{id}
      });
    }
    static getElections() {
      return this.findAll();
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

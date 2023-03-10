'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Question.belongsTo(models.Election, {
        foreignKey: "electionId",
      });
      Question.hasMany(models.Option, {
        onDelete: "CASCADE",
        foreignKey: "questionId",
      });
    }
    static async allQuestions(id) {
      // count=0
      try {
        const allQuestions = await Question.findAll({
          where: {
            electionId:id,
          },
        });
        return allQuestions;
      } catch (error) {
        console.log(error);
      }
    }
    static async deleteQuestion(id) {
      return await this.destroy({
        where: {
          id,
        },
        cascade: true,
      });
    }
    static async createQuestion({name , desc , electionId}) {
        return await this.create({
          name: name,
          desc: desc,
          electionId: electionId,
        });
    }
  static async updateQuestion({name,desc,questionId}){
    try{
      return await this.update({
        name: name,
        desc: desc,
      },{where:{
        id:questionId
      }})
    }catch(error){
      console.log(error);
    }
  }
  }
  Question.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "Proper question required!",
        },
      },
    },
    desc: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "Proper description required!",
        },
      },
    },
    electionId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};
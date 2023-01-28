'use strict';
const {
  Model
} = require('sequelize');
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Option extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Option.belongsTo(models.Question, {
        foreignKey: "questionId",
      });
    }
    static async createOption({name , questionId}) {
        // console.log("2222222222")
        return await this.create({
          name: name,
          questionId: questionId,
          optionCount: 0
        });
      
    }
    static async updateOption({updatedName,id}){
      try{
        return await this.update({
          name: updatedName,
        },{where:{
          id:id
        }})
      }catch(error){
        console.log(error);
      }
    }
    static async resetOptionCount(allQuestions){
      // console.log("2222")
      try{
        await Option.update(
          { optionCount: 0 },
          {
            where: {
              questionId: {
                [Op.in]: allQuestions
              },
            },
          }
        );
      }catch(error){
        console.log(error);
      }
    }
    static async getOptions(id) {
      try {
        const allOptions = await Option.findAll({
          where: {
            questionId:id,
          },
          order:[["id","ASC"
          ]]
        });
        return allOptions;
      } catch (error) {
        console.log(error);
      }
    }

    static async deleteOption(id) {
      return await this.destroy({
        where: {
          id,
        },
        cascade: true,
      });
    }
  }
  Option.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "Proper option required!",
        },
      },
    },
    questionId : DataTypes.INTEGER,
    optionCount: DataTypes.INTEGER

  }, {
    sequelize,
    modelName: 'Option',
  });
  return Option;
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.changeColumn("Admins", "email", {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Email already exists",
        },
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Proper email required!",
          },
        },
      });
  },

  async down (queryInterface, Sequelize) {

      await queryInterface.changeColumn("Admins", "email", {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      })
  }
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn("Options", "name", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "Proper option required!",
        },
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn("Options", "name", {
      type: Sequelize.STRING,
    })
  }
};

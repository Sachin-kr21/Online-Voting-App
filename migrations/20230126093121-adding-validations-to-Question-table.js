'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.changeColumn("Questions", "name", {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Proper Question required!",
          },
        },
      }),
      await queryInterface.changeColumn("Questions", "desc", {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Proper description required!",
          },
        },
      })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn("Questions", "name", {
      type: Sequelize.STRING,
    }),
    await queryInterface.changeColumn("Questions", "desc", {
      type: Sequelize.TEXT,
    })
  }
};

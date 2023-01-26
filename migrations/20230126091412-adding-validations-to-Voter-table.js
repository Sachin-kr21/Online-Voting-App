'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn("Voters", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "Proper email required!",
        },
      },
    }),
    await queryInterface.changeColumn("Voters", "password", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        async checkpwd(pwd) {
          if (await bcrypt.compare("", pwd)) {
            throw new Error("Invalid password");
          }
        },
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn("Voters", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    }),
    await queryInterface.changeColumn("Voters", "password", {
      type: Sequelize.STRING,
    });
  }
};

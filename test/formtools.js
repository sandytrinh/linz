var should = require('should'),
    linz = require('../linz');

linz.init({
    'mongo': 'mongodb://127.0.0.1/mongoose-formtools-test',
    'user model': 'user',
    'load models': false
});

// setup a basic user model
var UserSchema = new linz.mongoose.Schema({
    username: String,
    password: String,
    email: String
});

UserSchema.methods.toLabel = function () {
    return this.username;
};

UserSchema.virtual('hasAdminAccess').get(function () {
    return true;
});

var User = linz.mongoose.model('User', UserSchema);

User.label = 'Users';
User.singular = 'User';

// setup easy references
var mongoose = linz.mongoose,
	formtools = linz.formtools,
    async = require('async');

describe('formtools', function () {

	var PostSchema,
		PostModel,
		Text;

	describe('extends the schema', function () {

        before(function () {
            PostSchema = new mongoose.Schema({ label: String });
        });

		it('it adds the title virtual', function () {

			PostSchema.plugin(formtools.plugin);

			PostSchema.virtuals.should.have.property('title');
			PostSchema.paths.should.have.property('label');

		});

		it('gracefully handles existing title properties', function () {

			// create the schema
			var TestSchema = new mongoose.Schema({ title: String, label: String, name: String });

			// add the plugin
			TestSchema.plugin(formtools.plugin);

			// create the model and a new instance of the model
			var Test = mongoose.model('TestSchema', TestSchema),
				test = new Test();

			// set the title property
			test.title = 'Title value';

			// assert
			TestSchema.virtuals.should.not.have.property('title');
			test.title.should.equal('Title value');

		});

		it('virtual title returns label property second', function () {

			// create the schema
			var LabelTestSchema = new mongoose.Schema({ label: String, name: String });

			// add the plugin
			LabelTestSchema.plugin(formtools.plugin);

			// create the model and a new instance of the model
			var LabelTest = mongoose.model('LabelTest', LabelTestSchema),
				labeltest = new LabelTest();

			// set the label property
			labeltest.label = 'Title value';

			// assert
			LabelTestSchema.virtuals.should.have.property('title');
			labeltest.title.should.equal('Title value');

		});

		it('virtual title returns name property second', function () {

			// create the schema
			var NameTestSchema = new mongoose.Schema({ label: String, name: String });

			// add the plugin
			NameTestSchema.plugin(formtools.plugin);

			// create the model and a new instance of the model
			var NameTest = mongoose.model('NameTest', NameTestSchema),
				nametest = new NameTest();

			// set the label property
			nametest.name = 'Title value';

			// assert
			NameTestSchema.virtuals.should.have.property('title');
			nametest.title.should.equal('Title value');

		});

	});

	describe('scaffolds', function () {

        var OverridesPostSchema,
            OverridesPostModel,
            gridOpts,
            overridesGridOpts,
            formOpts,
            overridesFormOpts,
            list = {
                'one' : 'option 1',
                'two' : 'option 2'
            };

        before(function (done) {

			PostSchema = new mongoose.Schema({
				firstName: String,
                lastName: String,
                username: String,
                password: String,
				bActive: {
                    type: Boolean,
                    default: true
                },
                description: String,
                groups: String
			});

			PostSchema.plugin(formtools.plugin, {
				form: {
					firstName: {
						label: 'First Name',
                        helpText: 'Enter your first name',
                        create: {
                            visible: false,
                            disabled: true
                        },
                        edit: {
                            visible: false,
                            disabled: true
                        }
					},
					password: {
						label: 'Password',
                        visible: false,
                        disabled: true
					},
                    description: {
                        type: 'text'
                    },
					groups: {
                        list: list
                    }
				}
			});

			PostModel = mongoose.model('PostModel', PostSchema);

            OverridesPostSchema = new mongoose.Schema({
                firstName: String,
                lastName: String,
                username: String,
                password: String,
                bActive: {
                    type: Boolean,
                    default: true
                },
                description: String,
                groups: String
            });

            OverridesPostSchema.plugin(formtools.plugin, {
                grid: {
                    columns: {
                        title: 'Label',
                        firstName: {
                            label: 'Name',
                            renderer: linz.formtools.cellRenderers.overviewLink
                        },
                        email: 'Email',
                        username: 'Username',
                        bActive: 'Is active',
                        groups: {
                            label: 'Groups'
                        },
                        sendWelcomeEmail: {
                            label: 'Welcome email',
                            virtual: true,
                            renderer: function sendWelcomeEmailRenderer(record, fieldName, model, callback) {
                               callback(null,'success');
                            }
                        }
                    },
                    sortBy: ['firstName','lastName','dateModified'],
                    canCreate: false,
                    canEdit: false,
                    canDelete: false,
                    showSummary: false,
                    filters: {
                        firstName: 'First name',
                        lastName: {
                            filter: {
                                renderer: function customFilterRenderer (callback) {
                                    callback(null, '<input type="text" name="' + fieldName + '">');
                                },

                                filter: function customFilterFilter (form, callback) {
                                    callback(null, { firstname: form[fieldName] });
                                }
                            }
                        },
                        dateCreated: {
                            label: 'Date created',
                            filter: linz.formtools.filters.date
                        },
                        dateModified: {
                            label: 'Date modified',
                            filter: linz.formtools.filters.dateRange
                        },
                        bActive: {
                            label: 'Is Active?',
                            filter: linz.formtools.filters.checkbox
                        }
                    }
                },
                form: {
                    firstName: {
                        label: 'First Name',
                        helpText: 'Enter your first name',
                        create: {
                            visible: false,
                            disabled: true
                        },
                        edit: {
                            visible: false,
                            disabled: true
                        }
                    },
                    password: {
                        label: 'Password',
                        visible: false,
                        disabled: true
                    },
                    description: {
                        type: 'text'
                    },
                    groups: {
                        list: list
                    },
                    dateModified: {
                        label: 'Date modified'
                    }
                }
            });

            OverridesPostModel = mongoose.model('OverridesPostModel', OverridesPostSchema);

            async.parallel([

                function (cb) {
                    PostModel.getGrid(function (err, result) {
                        gridOpts = result;
                        cb(null);
                    });
                },

                function (cb) {
                    OverridesPostModel.getGrid(function (err, result) {
                        overridesGridOpts = result;
                        cb(null);
                    });
                },

                function (cb) {

                    PostModel.getForm(function (err, result) {
                        formOpts = result;
                        cb(null);
                    });
                }

            ], function () {

                // next middleware
                done();

            });

		}); // end before() for describe('scaffold')

        describe('grid', function () {

            describe('columns', function () {

                describe('with columns defaults', function () {

                    it('should have a title', function () {
                        gridOpts.columns.title.should.be.an.instanceOf(Object).and.have.property('label', 'Label');
                    });

                    it('should have a overview link renderer for title', function () {
                        gridOpts.columns.title.should.be.an.instanceOf(Object).and.have.property('renderer', linz.formtools.cellRenderers.overviewLink);
                    });

                    it('should have a status', function () {
                        gridOpts.columns.status.should.be.an.instanceOf(Object).and.have.property('label', 'Status');
                    });

                    it('should have a published date', function () {
                        gridOpts.columns.publishDate.should.be.an.instanceOf(Object).and.have.property('label', 'Publish date');
                    });

                    it('should have a date renderer for title', function () {
                        gridOpts.columns.publishDate.should.be.an.instanceOf(Object).and.have.property('renderer', linz.formtools.cellRenderers.date);
                    });

                    it('should have a created date', function () {
                        gridOpts.columns.dateCreated.should.be.an.instanceOf(Object).and.have.property('label', 'Date created');
                    });

                    it('should have a link renderer for created date', function () {
                        gridOpts.columns.dateCreated.should.be.an.instanceOf(Object).and.have.property('renderer', linz.formtools.cellRenderers.date);
                    });

                }); // end describe('columns defaults')

                describe("allowing column overrides", function () {

                    it('should overrides default column fields', function () {
                        // ensure default column fields are cleared
                        (overridesGridOpts.columns.status === undefined).should.be.true;
                    });

                    it('should set custom fields', function () {
                        overridesGridOpts.columns.firstName.should.have.property({
                            label: 'Name',
                            renderer: linz.formtools.cellRenderers.overviewLink
                        });
                    });

                    it('should default to overview link rendered for title, if renderer is not provided', function () {
                        overridesGridOpts.columns.title.renderer.name.should.equal('overviewLinkRenderer');
                    });

                }); // end describe('column overrides')

                describe("using cell renderer", function () {

                    describe("array", function () {

                        it("format an array of strings", function (done) {

                            linz.formtools.cellRenderers.array(['one','two','three'], [], 'firstName', PostModel, function (err, result) {

                                (err === null).should.be.ok;
                                result.should.equal('one,<br>two,<br>three');
                                done();

                            });

                        });

                    });

                    describe("date", function () {

                        it("format a date object", function (done) {

                            linz.formtools.cellRenderers.date(new Date(2014,0,1,0,0,0), [], 'firstName', PostModel, function (err, result) {

                                (err === null).should.be.ok;
                                result.should.equal('We 01/01/2014');
                                done();

                            });

                        });

                    });

                    describe("link", function () {

                        it("format a string with a link to the overview", function (done) {

                            linz.formtools.cellRenderers.overviewLink('label', {_id: '1'}, 'firstName', PostModel.modelName, function (err, result) {

                                (err === null).should.be.ok;
                                result.should.equal('<a href="' + linz.get('admin path') + '/PostModel/1/overview">label</a>');
                                done();

                            });

                        });

                    });

                    describe("default", function () {

                        it("format an array of strings", function (done) {

                            linz.formtools.cellRenderers.default(['one','two','three'], [], 'firstName', PostModel, function (err, result) {

                                (err === null).should.be.ok;
                                result.should.equal('one,<br>two,<br>three');
                                done();

                            });

                        });

                        it("format a date object", function (done) {

                            linz.formtools.cellRenderers.default(new Date(2014,0,1,0,0,0), [], 'firstName', PostModel, function (err, result) {

                                (err === null).should.be.ok;
                                result.should.equal('We 01/01/2014');
                                done();

                            });

                        });

                    });

                });

            })// end describe('columns')

            describe('actions', function () {

                describe('default actions', function () {

                    it('should be able to create new record', function () {
                        gridOpts.canCreate.should.be.true;
                    });

                    it('should be able to edit a record', function () {
                        gridOpts.canEdit.should.be.true;
                    });

                    it('should be able to delete a record', function () {
                        gridOpts.canDelete.should.be.true;
                    });

                    it('should display a summary', function () {
                        gridOpts.showSummary.should.be.true;
                    });

                }); // end describe('default actions')

                describe('overrides actions', function () {

                    it('should override can create', function () {
                        overridesGridOpts.canCreate.should.be.false;
                    })

                    it('should override can edit', function () {
                        overridesGridOpts.canEdit.should.be.false;
                    })

                    it('should override can delete', function () {
                        overridesGridOpts.canDelete.should.be.false;
                    })

                    it('should override show summary', function () {
                        overridesGridOpts.showSummary.should.be.false;
                    })

                }); // end describe('overrides actions')

            }); // end describe('action')

            describe('sorting', function () {

                describe('default sorting', function () {

                    it('should be sorted by date modified', function () {
                        gridOpts.sortBy[0].should.have.property({
                            label: 'Date modified',
                            field: 'dateModified'
                        });
                    });

                }); // end describe('default sorting')

                describe('overrides sorting', function () {

                    it('should overrides sorting options', function () {

                        overridesGridOpts.sortBy.should.eql([
                            {
                                label: 'First Name',
                                field: 'firstName'
                            },
                            {
                                label: 'lastName',
                                field: 'lastName'
                            },
                            {
                                label: 'Date modified',
                                field: 'dateModified'
                            }
                        ]);
                    });

                }); // end describe('overrides sorting')

            }); // end describe('sorting')

            describe('virtual columns',function () {

                it('should assign custom cell renderer for virtual column', function () {
                    overridesGridOpts.columns.sendWelcomeEmail.renderer.name.should.equal('sendWelcomeEmailRenderer');
                });

                it('should execute custom cell renderer for virtual column', function (done) {
                    overridesGridOpts.columns.sendWelcomeEmail.renderer({}, 'sendWelcomeEmail', 'mmsUser', function (err, value) {

                        if (err) {
                            throw err;
                        }

                        value.should.equal('success');

                        done();

                    });
                });

                it('should throw an error if custom renderer is not provided for virtual column', function () {

                    var ErrorVirtualColumnsSchema,
                        ErrorVirtualColumnsModel;

                    ErrorVirtualColumnsSchema = new mongoose.Schema({
                        firstName: String,
                        lastName: String,
                        username: String,
                        password: String,
                        bActive: {
                            type: Boolean,
                            default: true
                        },
                        description: String,
                        groups: String
                    });

                    try {

                        ErrorVirtualColumnsSchema.plugin(formtools.plugin, {
                            grid: {
                                columns: {
                                    title: 'Label',
                                    firstName: {
                                        label: 'Name',
                                        renderer: linz.formtools.cellRenderers.overviewLink
                                    },
                                    email: 'Email',
                                    username: 'Username',
                                    bActive: 'Is active',
                                    groups: {
                                        label: 'Groups'
                                    },
                                    sendWelcomeEmail: {
                                        label: 'Welcome email',
                                        virtual: true
                                    }
                                },
                                sortBy: ['firstName','lastName','dateModified'],
                                canCreate: false,
                                canEdit: false,
                                canDelete: false,
                                showSummary: false
                            },
                            form: {
                                firstName: {
                                    label: 'First Name',
                                    helpText: 'Enter your first name',
                                    create: {
                                        visible: false,
                                        disabled: true
                                    },
                                    edit: {
                                        visible: false,
                                        disabled: true
                                    }
                                },
                                password: {
                                    label: 'Password',
                                    visible: false,
                                    disabled: true
                                },
                                description: {
                                    type: 'text'
                                },
                                groups: {
                                    list: list
                                },
                                dateModified: {
                                    label: 'Date modified'
                                }
                            }
                        });

                    } catch (e) {

                        e.message.should.equal('Renderer attribute is missing for virtual column options.grid.columns.sendWelcomeEmail');

                    }

                });

            }); // end describe('virtual columns')

            describe('filters', function () {

                describe('setting filters', function () {

                    it('should convert a key name with string value in the filters to an object', function () {
                        overridesGridOpts.filters.firstName.should.have.property('label', 'First name');
                    });

                    it('should default to key name if a label is not provided in the filters object', function () {
                        overridesGridOpts.filters.lastName.should.have.property('label', 'lastName');
                    });

                    it('should set default filter if none provided', function () {
                        overridesGridOpts.filters.firstName.filter.should.equal(linz.formtools.filters.default);
                    });

                    it('should set custom filter & renderer if provided', function () {
                        (overridesGridOpts.filters.lastName.filter.renderer.name === 'customFilterRenderer' && overridesGridOpts.filters.lastName.filter.filter.name === 'customFilterFilter').should.be.true;
                    });

                });

                describe('using linz filter', function () {

                    describe('default filter', function () {

                        it('should render text input field', function (done) {
                            var fieldName = 'firstName';
                            linz.formtools.filters.default.renderer(fieldName,function (err, result) {
                                result.should.equal('<input type="text" name="' + fieldName + '" class="form-control">');
                                done();
                            });

                        });

                    });

                    describe('text filter', function () {

                        it('should render text input field', function (done) {
                            var fieldName = 'firstName';
                            linz.formtools.filters.text.renderer(fieldName,function (err, result) {
                                result.should.equal('<input type="text" name="' + fieldName + '" class="form-control">');
                                done();
                            });

                        });

                    });

                    describe('date filter', function () {

                        it('should render date input field', function (done) {
                            var fieldName = 'dateCreated';
                            linz.formtools.filters.date.renderer(fieldName,function (err, result) {
                                result.should.equal('<input type="date" name="' + fieldName + '" class="form-control">');
                                done();
                            });

                        });

                    });

                    describe('dateRange filter', function () {

                        it('should render 2 date input fields', function (done) {
                            var fieldName = 'dateModified';
                            linz.formtools.filters.dateRange.renderer(fieldName,function (err, result) {
                                result.should.equal('<input type="date" name="' + fieldName + '_dateFrom" class="form-control" style="width:50%;"><input type="date" name="' + fieldName + '_dateTo" class="form-control" style="width:50%;">');
                                done();
                            });

                        });

                    });

                    describe('checkbox filter', function () {

                        it('should render checkbox input field', function (done) {
                            var fieldName = 'dateModified';
                            linz.formtools.filters.checkbox.renderer(fieldName,function (err, result) {
                                result.should.equal('<input type="checkbox" name="' + fieldName + '" class="form-control">');
                                done();
                            });

                        });

                    });

                });



            }); // end describe('filters')

        }); // end  describe('grid')


        describe('form', function () {

            describe('form defaults', function () {
                describe('for each field', function () {

                    it('should set the label, if provided', function () {
                        formOpts['firstName'].label.should.equal('First Name');
                    });

                    it('should default label to field name, if none provided', function () {
                        formOpts['lastName'].label.should.equal('lastName');
                    });

                    it('should set visible, if provided', function () {
                        formOpts['password'].visible.should.be.false;
                    });

                    it('should default visible to true, if none provided', function () {
                        formOpts['firstName'].visible.should.be.true;
                    });

                    it('should set disabled, if provided', function () {
                        formOpts['password'].disabled.should.be.true;
                    });

                    it('should default disabled to false, if none provided', function () {
                        formOpts['firstName'].disabled.should.be.false;
                    });

                    it('should set helpText, if provided', function () {
                        formOpts['firstName'].helpText.should.equal('Enter your first name');
                    });

                    it('should default helpText to undefined, if none provided', function () {
                        (formOpts['password'].helpText === undefined).should.equal.true;
                    });

                    it('should set type, if provided', function () {
                        formOpts['description'].type.should.equal('text');
                    });

                    it('should default type to schema type if none provided', function () {
                        formOpts['firstName'].type.should.equal('string');
                    });

                    it('should set default value, if provided', function () {
                        formOpts['bActive'].default.should.be.true;
                    });

                    it('should set default value to undefined, if none provided', function () {
                        (formOpts['description'].default === undefined).should.equal.true;
                    });

                    it('should set list, if provided', function () {
                        formOpts['groups'].list.should.equal(list);
                    });

                    it('should default list to undefined, if none provided', function () {
                        (formOpts['description'].list === undefined).should.equal.true;
                    });

                });
            }); // end describe('form default')

    		describe('create form', function () {

    			describe('for each field', function () {

                    it('should inherit from visible', function () {
                        formOpts['password'].create.visible.should.be.false;
                    });

                    it('should override visible', function () {
                        formOpts['firstName'].create.visible.should.be.false;
                    });

                    it('should inherit from disabled', function () {
                        formOpts['password'].create.disabled.should.be.true;
                    });

                    it('should override disabled', function () {
                        formOpts['firstName'].create.disabled.should.be.true;
                    });

    			});

    		}); // end describe('create form')

            describe('edit form', function () {

                describe('for each field', function () {

                    it('should inherit visible', function () {
                        formOpts['firstName'].edit.visible.should.be.false;
                    });

                    it('should override visible', function () {
                        formOpts['password'].edit.visible.should.be.false;;
                    });

                    it('should inherit disabled', function () {
                        formOpts['password'].edit.disabled.should.be.true;
                    });

                    it('should override disabled', function () {
                        formOpts['firstName'].edit.disabled.should.be.true;
                    });

                });

            }); // end describe('edit form')

        }); // end describe('form')


	});

});

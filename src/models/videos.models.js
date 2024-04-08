import mongoose, { Schema } from 'mongoose';
import  mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


// create a schema for videos
const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default:true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }

    },{
        timestamps: true
    }
)

// calculate aggreagte video playback count using mongoose aggregate paginnate
videoSchema.plugin(mongooseAggregatePaginate)

export default mongoose.model('Video', videoSchema);